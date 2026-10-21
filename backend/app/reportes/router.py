from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import SesionBD, requiere_rol
from app.reportes.schemas import (
    AlertaStockItem,
    ProductoMasVendidoItem,
    ResumenVentasKPIs,
    VentaPorDiaItem,
    VentaPorMetodoPagoItem,
    VentaPorVendedorItem,
)
from app.reportes.service import ReportesService
from app.usuarios.models import RolUsuario

router = APIRouter(
    prefix="/reportes",
    tags=["Reportes"],
    dependencies=[Depends(requiere_rol(RolUsuario.ADMINISTRADOR, RolUsuario.GERENTE))],
)


def get_reportes_service(db: SesionBD) -> ReportesService:
    return ReportesService(db)


ServicioReportes = Annotated[ReportesService, Depends(get_reportes_service)]


@router.get(
    "/resumen",
    response_model=ResumenVentasKPIs,
    summary="Obtener métricas y KPIs generales de ventas e inventario (RF-30, RF-32)",
)
def obtener_resumen_kpis(
    servicio: ServicioReportes,
    fecha_inicio: Annotated[date | None, Query(description="Fecha de inicio (YYYY-MM-DD)")] = None,
    fecha_fin: Annotated[date | None, Query(description="Fecha de fin (YYYY-MM-DD)")] = None,
) -> ResumenVentasKPIs:
    """Calcula totales de ingresos, transacciones confirmadas, ticket promedio y alertas."""
    return servicio.obtener_resumen_kpis(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)


@router.get(
    "/ventas-por-dia",
    response_model=list[VentaPorDiaItem],
    summary="Serie temporal de ventas agrupadas por día para gráficos (RF-30)",
)
def obtener_ventas_por_dia(
    servicio: ServicioReportes,
    fecha_inicio: Annotated[date | None, Query()] = None,
    fecha_fin: Annotated[date | None, Query()] = None,
) -> list[VentaPorDiaItem]:
    """Retorna montos y número de transacciones por cada fecha del rango."""
    return servicio.obtener_ventas_por_dia(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)


@router.get(
    "/productos-mas-vendidos",
    response_model=list[ProductoMasVendidoItem],
    summary="Ranking de productos textiles más vendidos por rotación e ingresos (RF-31)",
)
def obtener_productos_mas_vendidos(
    servicio: ServicioReportes,
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
    fecha_inicio: Annotated[date | None, Query()] = None,
    fecha_fin: Annotated[date | None, Query()] = None,
) -> list[ProductoMasVendidoItem]:
    """Ranking de telas, hilos y prendas con mayor volumen comercial."""
    return servicio.obtener_productos_mas_vendidos(
        limit=limit, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin
    )


@router.get(
    "/ventas-por-vendedor",
    response_model=list[VentaPorVendedorItem],
    summary="Rendimiento de ventas por vendedor (RF-30)",
)
def obtener_ventas_por_vendedor(
    servicio: ServicioReportes,
    fecha_inicio: Annotated[date | None, Query()] = None,
    fecha_fin: Annotated[date | None, Query()] = None,
) -> list[VentaPorVendedorItem]:
    """Desglose de recaudación y cantidad de tickets emitidos por cada vendedor."""
    return servicio.obtener_ventas_por_vendedor(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)


@router.get(
    "/ventas-por-metodo-pago",
    response_model=list[VentaPorMetodoPagoItem],
    summary="Distribución de ventas por método de pago (RF-30)",
)
def obtener_ventas_por_metodo_pago(
    servicio: ServicioReportes,
    fecha_inicio: Annotated[date | None, Query()] = None,
    fecha_fin: Annotated[date | None, Query()] = None,
) -> list[VentaPorMetodoPagoItem]:
    """Participación porcentual de efectivo, billeteras digitales y tarjetas."""
    return servicio.obtener_ventas_por_metodo_pago(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)


@router.get(
    "/alertas-stock",
    response_model=list[AlertaStockItem],
    summary="Listado de productos con stock bajo o agotados (RF-31)",
)
def obtener_alertas_stock(
    servicio: ServicioReportes,
) -> list[AlertaStockItem]:
    """Lista crítica de artículos que requieren reabastecimiento o compra inmediata."""
    return servicio.obtener_alertas_stock()
