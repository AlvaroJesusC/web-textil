from decimal import Decimal

from sqlalchemy.orm import Session

from app.auditoria.models import Bitacora
from app.core.config import settings
from app.core.dinero import redondear
from app.core.excepciones import ConflictoError, DatosInvalidosError, NoEncontradoError
from app.inventario.models import EstadoProducto, MovimientoInventario, TipoMovimiento
from app.inventario.reglas import descontar_stock
from app.inventario.repository import ProductoRepository
from app.usuarios.models import RolUsuario, Usuario
from app.ventas.models import DetalleVenta, EstadoVenta, MetodoPago, Venta
from app.ventas.reglas import ItemVenta, calcular_total_venta
from app.ventas.repository import VentaRepository
from app.ventas.schemas import (
    AnularVentaPeticion,
    DetalleVentaRespuesta,
    VentaCrear,
    VentaRespuesta,
)


class VentaService:
    """Orquestación del flujo transaccional de ventas y anulación (RF-19 a RF-23, RF-26)."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = VentaRepository(db)
        self.prod_repo = ProductoRepository(db)

    def _convertir_a_respuesta(self, venta: Venta) -> VentaRespuesta:
        vendedor = self.db.get(Usuario, venta.vendedor_id)
        vendedor_nombre = vendedor.nombre if vendedor else None

        detalles_resp: list[DetalleVentaRespuesta] = []
        for d in venta.detalles:
            prod = self.prod_repo.obtener_por_id(d.producto_id)
            detalles_resp.append(
                DetalleVentaRespuesta(
                    id=d.id,
                    producto_id=d.producto_id,
                    producto_nombre=prod.nombre if prod else "Producto",
                    producto_sku=prod.sku if prod else "SKU",
                    cantidad=d.cantidad,
                    precio_unitario=d.precio_unitario,
                    subtotal=d.subtotal,
                )
            )

        return VentaRespuesta(
            id=venta.id,
            numero=venta.numero,
            fecha=venta.fecha,
            vendedor_id=venta.vendedor_id,
            vendedor_nombre=vendedor_nombre,
            cliente_nombre=venta.cliente_nombre,
            cliente_documento=venta.cliente_documento,
            metodo_pago=venta.metodo_pago,
            subtotal=venta.subtotal,
            descuento_pct=venta.descuento_pct,
            descuento=venta.descuento,
            igv=venta.igv,
            total=venta.total,
            estado=EstadoVenta(venta.estado),
            motivo_anulacion=venta.motivo_anulacion,
            detalles=detalles_resp,
        )

    def registrar_venta(self, datos: VentaCrear, vendedor: Usuario) -> VentaRespuesta:
        """Registra una venta en UNA sola transacción ACID (RF-23, RNF-16).

        1. Bloquea filas de productos (SELECT FOR UPDATE)
        2. Valida estado activo y stock de cada ítem (RN-05)
        3. Calcula subtotal, descuento, IGV y total mediante reglas puras (RN-02)
        4. Descuenta inventario y genera movimientos de kardex
        5. Guarda venta, detalles y bitácora
        Todo o nada.
        """
        # Determinar tope de descuento por rol
        if vendedor.rol == RolUsuario.VENDEDOR.value:
            tope_descuento = Decimal(str(settings.MAX_DESCUENTO_VENDEDOR))
        else:
            tope_descuento = Decimal("100.00")

        # Agrupar cantidades si hay productos repetidos en la petición
        cantidades_por_producto: dict[int, int] = {}
        for item in datos.items:
            cantidades_por_producto[item.producto_id] = (
                cantidades_por_producto.get(item.producto_id, 0) + item.cantidad
            )

        with self.db.begin_nested():
            # 1. Bloquear y verificar existencias
            productos_bloqueados = {}
            items_para_regla: list[ItemVenta] = []

            for prod_id, cantidad_total in cantidades_por_producto.items():
                producto = self.prod_repo.obtener_por_id_con_bloqueo(prod_id)
                if not producto:
                    raise NoEncontradoError(f"No existe el producto con ID {prod_id}.")

                if producto.estado != EstadoProducto.ACTIVO.value:
                    raise DatosInvalidosError(
                        f"El producto '{producto.nombre}' ({producto.sku}) "
                        "está inactivo y no se puede vender."
                    )

                # Regla de stock (RN-05): lanza StockInsuficienteError si no alcanza
                descontar_stock(
                    stock_actual=producto.stock_actual,
                    cantidad=cantidad_total,
                    producto_nombre=producto.nombre,
                    sku=producto.sku,
                )

                productos_bloqueados[prod_id] = producto
                items_para_regla.append(
                    ItemVenta(cantidad=cantidad_total, precio_unitario=producto.precio)
                )

            # 2. Cálculo puro y exacto de totales
            resumen = calcular_total_venta(
                items=items_para_regla,
                descuento_pct=datos.descuento_pct,
                tope_descuento_pct=tope_descuento,
            )

            # 3. Generar número correlativo
            numero_venta = self.repo.generar_siguiente_numero()

            # 4. Crear instancia de Venta
            venta = Venta(
                numero=numero_venta,
                vendedor_id=vendedor.id,
                cliente_nombre=datos.cliente_nombre.strip() if datos.cliente_nombre else None,
                cliente_documento=datos.cliente_documento.strip()
                if datos.cliente_documento
                else None,
                metodo_pago=datos.metodo_pago.value,
                subtotal=resumen.subtotal,
                descuento_pct=datos.descuento_pct,
                descuento=resumen.descuento,
                igv=resumen.igv,
                total=resumen.total,
                estado=EstadoVenta.CONFIRMADA.value,
            )
            self.repo.crear(venta)

            # 5. Descontar stock y registrar movimientos y detalles
            for prod_id, cantidad_total in cantidades_por_producto.items():
                producto = productos_bloqueados[prod_id]
                stock_anterior = producto.stock_actual
                nuevo_stock = descontar_stock(
                    stock_actual=stock_anterior,
                    cantidad=cantidad_total,
                    producto_nombre=producto.nombre,
                    sku=producto.sku,
                )
                producto.stock_actual = nuevo_stock

                # Movimiento de inventario (kardex)
                movimiento = MovimientoInventario(
                    producto_id=producto.id,
                    tipo=TipoMovimiento.VENTA.value,
                    cantidad=cantidad_total,
                    stock_anterior=stock_anterior,
                    stock_resultante=nuevo_stock,
                    motivo=f"Venta {numero_venta}",
                    documento=numero_venta,
                    usuario_id=vendedor.id,
                )
                self.prod_repo.registrar_movimiento(movimiento)

                # Detalle de la venta
                subtotal_linea = redondear(Decimal(cantidad_total) * producto.precio)
                detalle = DetalleVenta(
                    venta_id=venta.id,
                    producto_id=producto.id,
                    cantidad=cantidad_total,
                    precio_unitario=producto.precio,
                    subtotal=subtotal_linea,
                )
                self.db.add(detalle)

            # 6. Bitácora de auditoría (RF-34)
            bitacora = Bitacora(
                usuario_id=vendedor.id,
                usuario_nombre=vendedor.nombre,
                accion="REGISTRAR_VENTA",
                entidad="venta",
                entidad_id=str(venta.id),
                detalle=f"Venta {numero_venta} registrada por total de S/ {resumen.total}.",
            )
            self.repo.registrar_bitacora(bitacora)

        self.db.commit()
        venta_cargada = self.repo.obtener_por_id(venta.id)
        assert venta_cargada is not None
        return self._convertir_a_respuesta(venta_cargada)

    def anular_venta(
        self, venta_id: int, datos: AnularVentaPeticion, usuario: Usuario
    ) -> VentaRespuesta:
        """Anula una venta y devuelve el stock en una sola transacción (RF-26, F-05)."""
        with self.db.begin_nested():
            venta = self.repo.obtener_por_id(venta_id)
            if not venta:
                raise NoEncontradoError(f"No existe la venta con ID {venta_id}.")

            if venta.estado == EstadoVenta.ANULADA.value:
                raise ConflictoError(f"La venta {venta.numero} ya se encuentra anulada.")

            venta.estado = EstadoVenta.ANULADA.value
            venta.motivo_anulacion = datos.motivo.strip()

            # Devolver stock a cada producto
            for detalle in venta.detalles:
                producto = self.prod_repo.obtener_por_id_con_bloqueo(detalle.producto_id)
                if producto:
                    stock_anterior = producto.stock_actual
                    nuevo_stock = stock_anterior + detalle.cantidad
                    producto.stock_actual = nuevo_stock

                    movimiento = MovimientoInventario(
                        producto_id=producto.id,
                        tipo=TipoMovimiento.ANULACION.value,
                        cantidad=detalle.cantidad,
                        stock_anterior=stock_anterior,
                        stock_resultante=nuevo_stock,
                        motivo=f"Anulación venta {venta.numero}: {datos.motivo.strip()}",
                        documento=venta.numero,
                        usuario_id=usuario.id,
                    )
                    self.prod_repo.registrar_movimiento(movimiento)

            bitacora = Bitacora(
                usuario_id=usuario.id,
                usuario_nombre=usuario.nombre,
                accion="ANULAR_VENTA",
                entidad="venta",
                entidad_id=str(venta.id),
                detalle=f"Venta {venta.numero} anulada. Motivo: {datos.motivo.strip()}",
            )
            self.repo.registrar_bitacora(bitacora)

        self.db.commit()
        venta_actualizada = self.repo.obtener_por_id(venta.id)
        assert venta_actualizada is not None
        return self._convertir_a_respuesta(venta_actualizada)

    def listar_ventas(
        self,
        usuario_actual: Usuario,
        skip: int = 0,
        limit: int = 20,
        metodo_pago: MetodoPago | None = None,
        vendedor_id: int | None = None,
    ) -> tuple[list[VentaRespuesta], int]:
        # Si el usuario es vendedor, solo puede ver sus propias ventas (sección 1 permisos)
        if usuario_actual.rol == RolUsuario.VENDEDOR.value:
            vendedor_id_efectivo = usuario_actual.id
        else:
            vendedor_id_efectivo = vendedor_id

        items, total = self.repo.listar(
            skip=skip,
            limit=limit,
            vendedor_id=vendedor_id_efectivo,
            metodo_pago=metodo_pago,
        )
        return [self._convertir_a_respuesta(v) for v in items], total

    def obtener_venta(self, venta_id: int) -> VentaRespuesta:
        venta = self.repo.obtener_por_id(venta_id)
        if not venta:
            raise NoEncontradoError(f"No existe la venta con ID {venta_id}.")
        return self._convertir_a_respuesta(venta)
