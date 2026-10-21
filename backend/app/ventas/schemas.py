from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer

from app.ventas.models import EstadoVenta, MetodoPago

FormatoDecimal = Annotated[
    Decimal,
    PlainSerializer(lambda x: f"{x:.2f}", return_type=str, when_used="json"),
]


class ItemVentaPeticion(BaseModel):
    producto_id: int = Field(..., description="ID del producto a vender")
    cantidad: int = Field(..., gt=0, description="Cantidad entera mayor a 0 (RN-04)")


class VentaCrear(BaseModel):
    items: list[ItemVentaPeticion] = Field(
        ..., min_length=1, description="Lista de productos en la venta (mínimo 1 ítem)"
    )
    descuento_pct: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        le=100,
        description="Porcentaje de descuento global (0 a 100%)",
    )
    metodo_pago: MetodoPago = Field(
        default=MetodoPago.EFECTIVO, description="Método de pago utilizado"
    )
    cliente_nombre: str | None = Field(None, max_length=120, description="Nombre o razón social")
    cliente_documento: str | None = Field(None, max_length=20, description="DNI o RUC del cliente")


class DetalleVentaRespuesta(BaseModel):
    id: int
    producto_id: int
    producto_nombre: str | None = None
    producto_sku: str | None = None
    cantidad: int
    precio_unitario: FormatoDecimal
    subtotal: FormatoDecimal

    model_config = ConfigDict(from_attributes=True)


class VentaRespuesta(BaseModel):
    id: int
    numero: str
    fecha: datetime
    vendedor_id: int
    vendedor_nombre: str | None = None
    cliente_nombre: str | None = None
    cliente_documento: str | None = None
    metodo_pago: str
    subtotal: FormatoDecimal
    descuento_pct: FormatoDecimal
    descuento: FormatoDecimal
    igv: FormatoDecimal
    total: FormatoDecimal
    estado: EstadoVenta
    motivo_anulacion: str | None = None
    detalles: list[DetalleVentaRespuesta]

    model_config = ConfigDict(from_attributes=True)


class VentaListado(BaseModel):
    items: list[VentaRespuesta]
    total: int
    pagina: int
    por_pagina: int


class AnularVentaPeticion(BaseModel):
    motivo: str = Field(
        ..., min_length=3, max_length=255, description="Motivo obligatorio de anulación"
    )
