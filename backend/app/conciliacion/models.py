from datetime import UTC, datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.inventario.models import Producto
from app.usuarios.models import Usuario


class EstadoConteo(StrEnum):
    BORRADOR = "borrador"
    CERRADO = "cerrado"


class ConteoFisico(Base):
    __tablename__ = "conteo_fisico"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fecha: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
        index=True,
    )
    responsable_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("usuario.id"), nullable=False, index=True
    )
    estado: Mapped[str] = mapped_column(
        String(20), default=EstadoConteo.BORRADOR.value, nullable=False
    )
    observaciones: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Indicadores globales calculados
    total_items: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    items_conformes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    items_no_conformes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    porcentaje_conformidad: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("0.00"), nullable=False
    )
    cerrado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    responsable: Mapped["Usuario"] = relationship("Usuario")
    detalles: Mapped[list["DetalleConteo"]] = relationship(
        "DetalleConteo", back_populates="conteo", cascade="all, delete-orphan"
    )


class DetalleConteo(Base):
    __tablename__ = "detalle_conteo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    conteo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("conteo_fisico.id"), nullable=False, index=True
    )
    producto_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("producto.id"), nullable=False, index=True
    )

    stock_sistema: Mapped[int] = mapped_column(Integer, nullable=False)
    stock_fisico: Mapped[int | None] = mapped_column(Integer, nullable=True)
    diferencia: Mapped[int | None] = mapped_column(Integer, nullable=True)
    porcentaje_diferencia: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    conforme: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    ajustado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    conteo: Mapped["ConteoFisico"] = relationship("ConteoFisico", back_populates="detalles")
    producto: Mapped["Producto"] = relationship("Producto")
