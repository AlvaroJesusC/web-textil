from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Bitacora(Base):
    __tablename__ = "bitacora"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    usuario_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("usuario.id"), nullable=True, index=True
    )
    usuario_nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    accion: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entidad: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entidad_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    detalle: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
        index=True,
    )
