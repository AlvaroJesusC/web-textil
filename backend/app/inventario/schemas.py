from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer

from app.inventario.models import EstadoProducto, EstadoStock, UnidadMedida

# Serializador de dinero como string con 2 decimales para evitar pérdida de precisión en JSON
FormatoDecimal = Annotated[
    Decimal,
    PlainSerializer(lambda x: f"{x:.2f}", return_type=str, when_used="json"),
]


class CategoriaBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    descripcion: str | None = Field(None, max_length=255)


class CategoriaCrear(CategoriaBase):
    pass


class CategoriaRespuesta(CategoriaBase):
    id: int
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductoBase(BaseModel):
    sku: str = Field(..., min_length=1, max_length=50, description="Código SKU único")
    nombre: str = Field(..., min_length=1, max_length=150, description="Nombre del producto textil")
    descripcion: str | None = Field(None, description="Detalle o descripción técnica")
    categoria_id: int = Field(..., description="ID de la categoría a la que pertenece")
    unidad: UnidadMedida = Field(default=UnidadMedida.UNIDAD, description="Unidad de medida")
    precio: FormatoDecimal = Field(..., gt=0, description="Precio unitario en soles sin IGV")
    stock_minimo: int = Field(default=5, ge=0, description="Stock mínimo para alerta de reposición")


class ProductoCrear(ProductoBase):
    stock_actual: int = Field(default=0, ge=0, description="Stock inicial al crear el producto")


class ProductoActualizar(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=150)
    descripcion: str | None = None
    categoria_id: int | None = None
    unidad: UnidadMedida | None = None
    precio: FormatoDecimal | None = Field(None, gt=0)
    stock_minimo: int | None = Field(None, ge=0)
    estado: EstadoProducto | None = None


class ProductoRespuesta(ProductoBase):
    id: int
    stock_actual: int
    estado: str
    estado_stock: EstadoStock
    categoria_nombre: str | None = None
    creado_en: datetime
    actualizado_en: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductoListado(BaseModel):
    items: list[ProductoRespuesta]
    total: int
    pagina: int
    por_pagina: int


class IngresoStockPeticion(BaseModel):
    cantidad: int = Field(..., gt=0, description="Cantidad a ingresar (entero > 0)")
    proveedor: str | None = Field(None, max_length=150, description="Nombre del proveedor")
    documento: str | None = Field(None, max_length=100, description="Guía o factura de ingreso")
    motivo: str | None = Field(None, max_length=255, description="Observaciones")


class AjusteStockPeticion(BaseModel):
    nuevo_stock: int = Field(..., ge=0, description="Nuevo stock físico (entero >= 0)")
    motivo: str = Field(
        ..., min_length=3, max_length=255, description="Motivo obligatorio del ajuste"
    )


class MovimientoRespuesta(BaseModel):
    id: int
    producto_id: int
    tipo: str
    cantidad: int
    stock_anterior: int
    stock_resultante: int
    motivo: str | None
    proveedor: str | None
    documento: str | None
    usuario_id: int | None
    fecha: datetime

    model_config = ConfigDict(from_attributes=True)
