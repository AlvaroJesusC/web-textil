from datetime import UTC, datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UnidadMedida(StrEnum):
    METRO = "metro"
    CONO = "cono"
    UNIDAD = "unidad"
    BOLSA = "bolsa"


class EstadoProducto(StrEnum):
    ACTIVO = "activo"
    INACTIVO = "inactivo"


class EstadoStock(StrEnum):
    NORMAL = "normal"
    BAJO = "bajo"
    AGOTADO = "agotado"
    INACTIVO = "inactivo"


class TipoMovimiento(StrEnum):
    INGRESO = "ingreso"
    VENTA = "venta"
    AJUSTE = "ajuste"
    ANULACION = "anulacion"


class Categoria(Base):
    __tablename__ = "categoria"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    productos: Mapped[list["Producto"]] = relationship("Producto", back_populates="categoria")


class Producto(Base):
    __tablename__ = "producto"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sku: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    categoria_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("categoria.id"), nullable=False, index=True
    )
    unidad: Mapped[str] = mapped_column(
        String(20), default=UnidadMedida.UNIDAD.value, nullable=False
    )
    precio: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    stock_actual: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    stock_minimo: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    estado: Mapped[str] = mapped_column(
        String(20), default=EstadoProducto.ACTIVO.value, nullable=False
    )

    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    categoria: Mapped["Categoria"] = relationship("Categoria", back_populates="productos")
    movimientos: Mapped[list["MovimientoInventario"]] = relationship(
        "MovimientoInventario", back_populates="producto"
    )


class MovimientoInventario(Base):
    __tablename__ = "movimiento_inventario"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    producto_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("producto.id"), nullable=False, index=True
    )
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    stock_anterior: Mapped[int] = mapped_column(Integer, nullable=False)
    stock_resultante: Mapped[int] = mapped_column(Integer, nullable=False)
    motivo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    proveedor: Mapped[str | None] = mapped_column(String(150), nullable=True)
    documento: Mapped[str | None] = mapped_column(String(100), nullable=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("usuario.id"), nullable=True)
    fecha: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
        index=True,
    )

    producto: Mapped["Producto"] = relationship("Producto", back_populates="movimientos")
