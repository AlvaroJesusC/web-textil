from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.dinero import redondear
from app.reportes.repository import ReportesRepository
from app.reportes.schemas import (
    AlertaStockItem,
    ProductoMasVendidoItem,
    ResumenVentasKPIs,
    VentaPorDiaItem,
    VentaPorMetodoPagoItem,
    VentaPorVendedorItem,
)


class ReportesService:
    """Servicio de negocio para reportería gerencial y cálculo de indicadores (RF-30 al RF-32)."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = ReportesRepository(db)

    def obtener_resumen_kpis(
        self,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
    ) -> ResumenVentasKPIs:
        raw = self.repo.obtener_resumen_kpis(fecha_inicio, fecha_fin)

        total_ingresos = raw["total_ingresos"]
        total_transacciones = raw["total_transacciones"]

        if total_transacciones > 0:
            ticket_promedio = redondear(total_ingresos / Decimal(total_transacciones))
        else:
            ticket_promedio = Decimal("0.00")

        return ResumenVentasKPIs(
            total_ingresos=total_ingresos,
            total_transacciones=total_transacciones,
            ticket_promedio=ticket_promedio,
            total_unidades=raw["total_unidades"],
            productos_stock_bajo=raw["productos_stock_bajo"],
            productos_agotados=raw["productos_agotados"],
        )

    def obtener_ventas_por_dia(
        self,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
    ) -> list[VentaPorDiaItem]:
        items = self.repo.obtener_ventas_por_dia(fecha_inicio, fecha_fin)
        return [VentaPorDiaItem(**it) for it in items]

    def obtener_productos_mas_vendidos(
        self,
        limit: int = 10,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
    ) -> list[ProductoMasVendidoItem]:
        items = self.repo.obtener_productos_mas_vendidos(
            limit=limit,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
        )
        return [ProductoMasVendidoItem(**it) for it in items]

    def obtener_ventas_por_vendedor(
        self,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
    ) -> list[VentaPorVendedorItem]:
        items = self.repo.obtener_ventas_por_vendedor(fecha_inicio, fecha_fin)
        return [VentaPorVendedorItem(**it) for it in items]

    def obtener_ventas_por_metodo_pago(
        self,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
    ) -> list[VentaPorMetodoPagoItem]:
        items = self.repo.obtener_ventas_por_metodo_pago(fecha_inicio, fecha_fin)
        gran_total = sum((it["total_recaudado"] for it in items), Decimal("0.00"))

        resultado: list[VentaPorMetodoPagoItem] = []
        for it in items:
            if gran_total > 0:
                pct = redondear((it["total_recaudado"] / gran_total) * Decimal("100"))
            else:
                pct = Decimal("0.00")

            resultado.append(
                VentaPorMetodoPagoItem(
                    metodo_pago=it["metodo_pago"],
                    cantidad_ventas=it["cantidad_ventas"],
                    total_recaudado=it["total_recaudado"],
                    porcentaje=pct,
                )
            )

        return resultado

    def obtener_alertas_stock(self) -> list[AlertaStockItem]:
        items = self.repo.obtener_alertas_stock()
        return [AlertaStockItem(**it) for it in items]
