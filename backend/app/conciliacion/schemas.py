from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ItemConteoInput(BaseModel):
    """Entrada para registrar o actualizar el conteo físico de un producto (RN-08)."""

    producto_id: int
    stock_fisico: int = Field(
        ...,
        ge=0,
        description="Conteo físico verificado en almacén (entero >= 0).",
    )


class ActualizarConteosRequest(BaseModel):
    items: list[ItemConteoInput] = Field(
        ..., min_length=1, description="Lista de conteos físicos por producto"
    )


class ConteoCrearRequest(BaseModel):
    observaciones: str | None = Field(
        None, max_length=255, description="Observaciones iniciales del conteo"
    )


class DetalleConteoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    producto_id: int
    producto_sku: str
    producto_nombre: str
    categoria_nombre: str
    unidad: str
    stock_sistema: int
    stock_fisico: int | None = None
    diferencia: int | None = None
    porcentaje_diferencia: Decimal | None = None
    conforme: bool | None = None
    ajustado: bool = False


class ConteoFisicoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fecha: datetime
    responsable_id: int
    responsable_nombre: str
    estado: str
    observaciones: str | None = None
    total_items: int
    items_conformes: int
    items_no_conformes: int
    porcentaje_conformidad: Decimal
    cerrado_en: datetime | None = None
    detalles: list[DetalleConteoRespuesta] = []


class ConteoFisicoListado(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fecha: datetime
    responsable_id: int
    responsable_nombre: str
    estado: str
    total_items: int
    items_conformes: int
    items_no_conformes: int
    porcentaje_conformidad: Decimal
    cerrado_en: datetime | None = None


class AjustarStockConteoRequest(BaseModel):
    motivo: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Motivo obligatorio para registrar el ajuste de stock (RF-29).",
    )
    producto_ids: list[int] | None = Field(
        None,
        description="Lista opcional de IDs a ajustar. Si es None, ajusta no conformes pendientes.",
    )


class AjustarStockConteoRespuesta(BaseModel):
    conteo_id: int
    productos_ajustados: int
    mensaje: str
