from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.inventario.models import Categoria, EstadoProducto, Producto
from app.usuarios.models import Usuario
from app.ventas.models import DetalleVenta, EstadoVenta, Venta


class ReportesRepository:
    """Consultas analíticas para reportería gerencial y operativa (RF-30 al RF-32, RNF-17)."""

    def __init__(self, db: Session):
        self.db = db

    def _aplicar_rango_fechas(
        self,
        query,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
    ):
        if fecha_inicio:
            dt_inicio = datetime.combine(fecha_inicio, time.min)
            query = query.where(Venta.fecha >= dt_inicio)
        if fecha_fin:
            dt_fin = datetime.combine(fecha_fin, time.max)
            query = query.where(Venta.fecha <= dt_fin)
        return query

    def obtener_resumen_kpis(
        self,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
    ) -> dict:
        """Calcula los totales de ingresos, transacciones, ticket promedio y unidades vendidas."""
        # 1. Total ventas confirmadas
        q_ventas = select(
            func.coalesce(func.sum(Venta.total), 0).label("total_ingresos"),
            func.count(Venta.id).label("total_transacciones"),
        ).where(Venta.estado == EstadoVenta.CONFIRMADA.value)
        q_ventas = self._aplicar_rango_fechas(q_ventas, fecha_inicio, fecha_fin)
        res_ventas = self.db.execute(q_ventas).one()

        total_ingresos = Decimal(str(res_ventas.total_ingresos))
        total_transacciones = int(res_ventas.total_transacciones)

        # 2. Total unidades vendidas
        q_detalles = (
            select(func.coalesce(func.sum(DetalleVenta.cantidad), 0))
            .join(Venta, DetalleVenta.venta_id == Venta.id)
            .where(Venta.estado == EstadoVenta.CONFIRMADA.value)
        )
        q_detalles = self._aplicar_rango_fechas(q_detalles, fecha_inicio, fecha_fin)
        total_unidades = int(self.db.scalar(q_detalles) or 0)

        # 3. Alertas de inventario actual
        q_stock_bajo = select(func.count(Producto.id)).where(
            Producto.estado == EstadoProducto.ACTIVO.value,
            Producto.stock_actual <= Producto.stock_minimo,
            Producto.stock_actual > 0,
        )
        stock_bajo = int(self.db.scalar(q_stock_bajo) or 0)

        q_agotados = select(func.count(Producto.id)).where(
            Producto.estado == EstadoProducto.ACTIVO.value,
            Producto.stock_actual == 0,
        )
        agotados = int(self.db.scalar(q_agotados) or 0)

        return {
            "total_ingresos": total_ingresos,
            "total_transacciones": total_transacciones,
            "total_unidades": total_unidades,
            "productos_stock_bajo": stock_bajo,
            "productos_agotados": agotados,
        }

    def obtener_ventas_por_dia(
        self,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
    ) -> list[dict]:
        """Agrupa las ventas confirmadas por día para gráficos de línea y series de tiempo."""
        col_fecha = func.date(Venta.fecha).label("fecha_dia")
        query = (
            select(
                col_fecha,
                func.coalesce(func.sum(Venta.total), 0).label("total"),
                func.count(Venta.id).label("cantidad"),
            )
            .where(Venta.estado == EstadoVenta.CONFIRMADA.value)
            .group_by(col_fecha)
            .order_by(col_fecha.asc())
        )
        query = self._aplicar_rango_fechas(query, fecha_inicio, fecha_fin)
        filas = self.db.execute(query).all()

        return [
            {
                "fecha": str(f.fecha_dia),
                "total": Decimal(str(f.total)),
                "cantidad_transacciones": int(f.cantidad),
            }
            for f in filas
        ]

    def obtener_productos_mas_vendidos(
        self,
        limit: int = 10,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
    ) -> list[dict]:
        """Obtiene el ranking de los productos textiles con mayor rotación e ingresos generados."""
        query = (
            select(
                Producto.id.label("producto_id"),
                Producto.sku.label("sku"),
                Producto.nombre.label("nombre"),
                Categoria.nombre.label("categoria"),
                Producto.unidad.label("unidad"),
                func.sum(DetalleVenta.cantidad).label("cantidad_vendida"),
                func.sum(DetalleVenta.subtotal).label("total_recaudado"),
            )
            .join(DetalleVenta, DetalleVenta.producto_id == Producto.id)
            .join(Venta, DetalleVenta.venta_id == Venta.id)
            .join(Categoria, Producto.categoria_id == Categoria.id)
            .where(Venta.estado == EstadoVenta.CONFIRMADA.value)
            .group_by(
                Producto.id,
                Producto.sku,
                Producto.nombre,
                Categoria.nombre,
                Producto.unidad,
            )
            .order_by(func.sum(DetalleVenta.cantidad).desc())
            .limit(limit)
        )
        query = self._aplicar_rango_fechas(query, fecha_inicio, fecha_fin)
        filas = self.db.execute(query).all()

        return [
            {
                "producto_id": f.producto_id,
                "sku": f.sku,
                "nombre": f.nombre,
                "categoria": f.categoria,
                "unidad": f.unidad,
                "cantidad_vendida": int(f.cantidad_vendida),
                "total_recaudado": Decimal(str(f.total_recaudado)),
            }
            for f in filas
        ]

    def obtener_ventas_por_vendedor(
        self,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
    ) -> list[dict]:
        """Rendimiento comercial por usuario vendedor."""
        query = (
            select(
                Usuario.id.label("vendedor_id"),
                Usuario.nombre.label("vendedor_nombre"),
                func.count(Venta.id).label("cantidad_ventas"),
                func.coalesce(func.sum(Venta.total), 0).label("total_recaudado"),
            )
            .join(Venta, Venta.vendedor_id == Usuario.id)
            .where(Venta.estado == EstadoVenta.CONFIRMADA.value)
            .group_by(Usuario.id, Usuario.nombre)
            .order_by(func.sum(Venta.total).desc())
        )
        query = self._aplicar_rango_fechas(query, fecha_inicio, fecha_fin)
        filas = self.db.execute(query).all()

        return [
            {
                "vendedor_id": f.vendedor_id,
                "vendedor_nombre": f.vendedor_nombre,
                "cantidad_ventas": int(f.cantidad_ventas),
                "total_recaudado": Decimal(str(f.total_recaudado)),
            }
            for f in filas
        ]

    def obtener_ventas_por_metodo_pago(
        self,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
    ) -> list[dict]:
        """Distribución de cobros por método de pago (efectivo, Yape/Plin, tarjeta, etc.)."""
        query = (
            select(
                Venta.metodo_pago,
                func.count(Venta.id).label("cantidad_ventas"),
                func.coalesce(func.sum(Venta.total), 0).label("total_recaudado"),
            )
            .where(Venta.estado == EstadoVenta.CONFIRMADA.value)
            .group_by(Venta.metodo_pago)
            .order_by(func.sum(Venta.total).desc())
        )
        query = self._aplicar_rango_fechas(query, fecha_inicio, fecha_fin)
        filas = self.db.execute(query).all()

        return [
            {
                "metodo_pago": f.metodo_pago,
                "cantidad_ventas": int(f.cantidad_ventas),
                "total_recaudado": Decimal(str(f.total_recaudado)),
            }
            for f in filas
        ]

    def obtener_alertas_stock(self) -> list[dict]:
        """Lista productos en estado crítico: stock bajo o stock agotado."""
        query = (
            select(
                Producto.id.label("producto_id"),
                Producto.sku.label("sku"),
                Producto.nombre.label("nombre"),
                Categoria.nombre.label("categoria"),
                Producto.unidad.label("unidad"),
                Producto.stock_actual.label("stock_actual"),
                Producto.stock_minimo.label("stock_minimo"),
            )
            .join(Categoria, Producto.categoria_id == Categoria.id)
            .where(
                Producto.estado == EstadoProducto.ACTIVO.value,
                Producto.stock_actual <= Producto.stock_minimo,
            )
            .order_by(Producto.stock_actual.asc())
        )
        filas = self.db.execute(query).all()

        return [
            {
                "producto_id": f.producto_id,
                "sku": f.sku,
                "nombre": f.nombre,
                "categoria": f.categoria,
                "unidad": f.unidad,
                "stock_actual": f.stock_actual,
                "stock_minimo": f.stock_minimo,
                "estado_stock": "agotado" if f.stock_actual == 0 else "bajo",
            }
            for f in filas
        ]
