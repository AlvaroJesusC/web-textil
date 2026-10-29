from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.excepciones import ConflictoError, DatosInvalidosError, NoEncontradoError
from app.inventario.models import (
    Categoria,
    EstadoProducto,
    EstadoStock,
    MovimientoInventario,
    Producto,
    TipoMovimiento,
)
from app.inventario.reglas import DatosProducto, estado_stock, validar_producto
from app.inventario.repository import ProductoRepository
from app.inventario.schemas import (
    AjusteStockPeticion,
    CategoriaCrear,
    CategoriaRespuesta,
    IngresoStockPeticion,
    MovimientoRespuesta,
    ProductoActualizar,
    ProductoCrear,
    ProductoRespuesta,
)


class InventarioService:
    """Orquestación del inventario, validaciones y movimientos (RNF-17)."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = ProductoRepository(db)

    def _convertir_a_respuesta(self, p: Producto) -> ProductoRespuesta:
        est = estado_stock(
            stock=p.stock_actual,
            stock_minimo=p.stock_minimo,
            activo=(p.estado == EstadoProducto.ACTIVO.value),
        )
        cat_nombre = p.categoria.nombre if p.categoria else None
        return ProductoRespuesta(
            id=p.id,
            sku=p.sku,
            nombre=p.nombre,
            descripcion=p.descripcion,
            categoria_id=p.categoria_id,
            categoria_nombre=cat_nombre,
            unidad=p.unidad,  # type: ignore[arg-type]
            precio=p.precio,
            stock_actual=p.stock_actual,
            stock_minimo=p.stock_minimo,
            estado=p.estado,
            estado_stock=est,
            creado_en=p.creado_en,
            actualizado_en=p.actualizado_en,
        )

    def listar_productos(
        self,
        skip: int = 0,
        limit: int = 20,
        termino_busqueda: str | None = None,
        categoria_id: int | None = None,
        filtro_estado_stock: EstadoStock | None = None,
        solo_activos: bool = False,
    ) -> tuple[list[ProductoRespuesta], int]:
        items, total = self.repo.listar(
            skip=skip,
            limit=limit,
            termino_busqueda=termino_busqueda,
            categoria_id=categoria_id,
            filtro_estado_stock=filtro_estado_stock,
            solo_activos=solo_activos,
        )

        respuestas = [self._convertir_a_respuesta(p) for p in items]
        return respuestas, total

    def obtener_producto(self, producto_id: int) -> ProductoRespuesta:
        producto = self.repo.obtener_por_id(producto_id)
        if not producto:
            raise NoEncontradoError(f"No se encontró el producto con ID {producto_id}.")
        return self._convertir_a_respuesta(producto)

    def crear_producto(
        self, datos: ProductoCrear, usuario_id: int | None = None
    ) -> ProductoRespuesta:
        # 1. Validación de reglas puras (RN-09)
        errores = validar_producto(
            DatosProducto(
                sku=datos.sku,
                nombre=datos.nombre,
                precio=datos.precio,
                stock=datos.stock_actual,
                stock_minimo=datos.stock_minimo,
            )
        )
        if errores:
            raise DatosInvalidosError(
                detalle="Errores de validación en los datos del producto.",
                campos=errores,
            )

        # 2. Validación de unicidad de SKU
        sku_limpio = datos.sku.strip().upper()
        if self.repo.obtener_por_sku(sku_limpio):
            raise ConflictoError(f"El código SKU '{sku_limpio}' ya está registrado.")

        # 3. Categoría existente
        if not self.repo.obtener_categoria_por_id(datos.categoria_id):
            raise NoEncontradoError(f"La categoría con ID {datos.categoria_id} no existe.")

        with self.db.begin_nested():
            producto = Producto(
                sku=sku_limpio,
                nombre=datos.nombre.strip(),
                descripcion=datos.descripcion.strip() if datos.descripcion else None,
                categoria_id=datos.categoria_id,
                unidad=datos.unidad.value,
                precio=datos.precio,
                stock_actual=datos.stock_actual,
                stock_minimo=datos.stock_minimo,
                estado=EstadoProducto.ACTIVO.value,
            )
            self.repo.crear(producto)

            if datos.stock_actual > 0:
                mov = MovimientoInventario(
                    producto_id=producto.id,
                    tipo=TipoMovimiento.INGRESO.value,
                    cantidad=datos.stock_actual,
                    stock_anterior=0,
                    stock_resultante=datos.stock_actual,
                    motivo="Inventario inicial al crear producto",
                    usuario_id=usuario_id,
                )
                self.repo.registrar_movimiento(mov)

        self.db.commit()
        # Recargar con relaciones
        producto_completo = self.repo.obtener_por_id(producto.id)
        assert producto_completo is not None
        return self._convertir_a_respuesta(producto_completo)

    def actualizar_producto(self, producto_id: int, datos: ProductoActualizar) -> ProductoRespuesta:
        producto = self.repo.obtener_por_id(producto_id)
        if not producto:
            raise NoEncontradoError(f"No se encontró el producto con ID {producto_id}.")

        if datos.nombre is not None:
            if not datos.nombre.strip():
                raise DatosInvalidosError("El nombre no puede estar vacío.")
            producto.nombre = datos.nombre.strip()

        if datos.descripcion is not None:
            producto.descripcion = datos.descripcion.strip() if datos.descripcion else None

        if datos.categoria_id is not None:
            if not self.repo.obtener_categoria_por_id(datos.categoria_id):
                raise NoEncontradoError(f"La categoría {datos.categoria_id} no existe.")
            producto.categoria_id = datos.categoria_id

        if datos.unidad is not None:
            producto.unidad = datos.unidad.value

        if datos.precio is not None:
            if datos.precio <= Decimal("0"):
                raise DatosInvalidosError("El precio debe ser mayor a 0.")
            producto.precio = datos.precio

        if datos.stock_minimo is not None:
            if datos.stock_minimo < 0:
                raise DatosInvalidosError("El stock mínimo no puede ser negativo.")
            producto.stock_minimo = datos.stock_minimo

        if datos.estado is not None:
            producto.estado = datos.estado.value

        self.db.commit()
        self.db.refresh(producto)
        return self._convertir_a_respuesta(producto)

    def registrar_ingreso_stock(
        self,
        producto_id: int,
        datos: IngresoStockPeticion,
        usuario_id: int | None = None,
    ) -> ProductoRespuesta:
        """Registra ingreso de mercadería y genera movimiento (RF-11)."""
        if datos.cantidad <= 0:
            raise DatosInvalidosError("La cantidad ingresada debe ser mayor a 0.")

        with self.db.begin_nested():
            producto = self.repo.obtener_por_id_con_bloqueo(producto_id)
            if not producto:
                raise NoEncontradoError(f"No se encontró el producto con ID {producto_id}.")

            stock_anterior = producto.stock_actual
            nuevo_stock = stock_anterior + datos.cantidad
            producto.stock_actual = nuevo_stock

            movimiento = MovimientoInventario(
                producto_id=producto.id,
                tipo=TipoMovimiento.INGRESO.value,
                cantidad=datos.cantidad,
                stock_anterior=stock_anterior,
                stock_resultante=nuevo_stock,
                proveedor=datos.proveedor,
                documento=datos.documento,
                motivo=datos.motivo or "Ingreso de stock a almacén",
                usuario_id=usuario_id,
            )
            self.repo.registrar_movimiento(movimiento)

        self.db.commit()
        producto_refrescado = self.repo.obtener_por_id(producto_id)
        assert producto_refrescado is not None
        return self._convertir_a_respuesta(producto_refrescado)

    def registrar_ajuste_stock(
        self,
        producto_id: int,
        datos: AjusteStockPeticion,
        usuario_id: int | None = None,
    ) -> ProductoRespuesta:
        """Ajusta manualmente el stock con motivo obligatorio (RF-12)."""
        if datos.nuevo_stock < 0:
            raise DatosInvalidosError("El nuevo stock no puede ser negativo.")

        if not datos.motivo.strip():
            raise DatosInvalidosError("El motivo del ajuste es obligatorio.")

        with self.db.begin_nested():
            producto = self.repo.obtener_por_id_con_bloqueo(producto_id)
            if not producto:
                raise NoEncontradoError(f"No se encontró el producto con ID {producto_id}.")

            stock_anterior = producto.stock_actual
            diferencia = abs(datos.nuevo_stock - stock_anterior)
            producto.stock_actual = datos.nuevo_stock

            movimiento = MovimientoInventario(
                producto_id=producto.id,
                tipo=TipoMovimiento.AJUSTE.value,
                cantidad=diferencia,
                stock_anterior=stock_anterior,
                stock_resultante=datos.nuevo_stock,
                motivo=datos.motivo.strip(),
                usuario_id=usuario_id,
            )
            self.repo.registrar_movimiento(movimiento)

        self.db.commit()
        producto_refrescado = self.repo.obtener_por_id(producto_id)
        assert producto_refrescado is not None
        return self._convertir_a_respuesta(producto_refrescado)

    def listar_kardex(self, producto_id: int) -> list[MovimientoRespuesta]:
        """Consulta el historial de movimientos de un producto (RF-14)."""
        if not self.repo.obtener_por_id(producto_id):
            raise NoEncontradoError(f"No se encontró el producto con ID {producto_id}.")
        movimientos = self.repo.listar_movimientos(producto_id)
        return [MovimientoRespuesta.model_validate(m) for m in movimientos]

    # Categorías
    def listar_categorias(self) -> list[CategoriaRespuesta]:
        cats = self.repo.listar_categorias()
        return [CategoriaRespuesta.model_validate(c) for c in cats]

    def crear_categoria(self, datos: CategoriaCrear) -> CategoriaRespuesta:
        cat = Categoria(
            nombre=datos.nombre.strip(),
            descripcion=datos.descripcion.strip() if datos.descripcion else None,
        )
        self.repo.crear_categoria(cat)
        self.db.commit()
        self.db.refresh(cat)
        return CategoriaRespuesta.model_validate(cat)
