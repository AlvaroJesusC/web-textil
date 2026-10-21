from datetime import UTC, datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MetodoPago(StrEnum):
    EFECTIVO = "efectivo"
    YAPE_PLIN = "yape_plin"
    TRANSFERENCIA = "transferencia"
    TARJETA = "tarjeta"


class EstadoVenta(StrEnum):
    CONFIRMADA = "confirmada"
    ANULADA = "anulada"


class Venta(Base):
    __tablename__ = "venta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    numero: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    fecha: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
        index=True,
    )
    vendedor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("usuario.id"), nullable=False, index=True
    )
    cliente_nombre: Mapped[str | None] = mapped_column(String(120), nullable=True)
    cliente_documento: Mapped[str | None] = mapped_column(String(20), nullable=True)
    metodo_pago: Mapped[str] = mapped_column(
        String(30), default=MetodoPago.EFECTIVO.value, nullable=False
    )

    # Importes con 2 decimales (RN-01, RN-02)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    descuento_pct: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("0.00"), nullable=False
    )
    descuento: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0.00"), nullable=False
    )
    igv: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    estado: Mapped[str] = mapped_column(
        String(20), default=EstadoVenta.CONFIRMADA.value, nullable=False
    )
    motivo_anulacion: Mapped[str | None] = mapped_column(String(255), nullable=True)

    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    detalles: Mapped[list["DetalleVenta"]] = relationship(
        "DetalleVenta", back_populates="venta", cascade="all, delete-orphan"
    )


class DetalleVenta(Base):
    __tablename__ = "detalle_venta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    venta_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("venta.id"), nullable=False, index=True
    )
    producto_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("producto.id"), nullable=False, index=True
    )
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    venta: Mapped["Venta"] = relationship("Venta", back_populates="detalles")
