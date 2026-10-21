from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ResumenVentasKPIs(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_ingresos: Decimal
    total_transacciones: int
    ticket_promedio: Decimal
    total_unidades: int
    productos_stock_bajo: int
    productos_agotados: int


class VentaPorDiaItem(BaseModel):
    fecha: str
    total: Decimal
    cantidad_transacciones: int


class ProductoMasVendidoItem(BaseModel):
    producto_id: int
    sku: str
    nombre: str
    categoria: str
    unidad: str
    cantidad_vendida: int
    total_recaudado: Decimal


class VentaPorVendedorItem(BaseModel):
    vendedor_id: int
    vendedor_nombre: str
    cantidad_ventas: int
    total_recaudado: Decimal


class VentaPorMetodoPagoItem(BaseModel):
    metodo_pago: str
    cantidad_ventas: int
    total_recaudado: Decimal
    porcentaje: Decimal


class AlertaStockItem(BaseModel):
    producto_id: int
    sku: str
    nombre: str
    categoria: str
    unidad: str
    stock_actual: int
    stock_minimo: int
    estado_stock: str


class FiltroReporteParams(BaseModel):
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
