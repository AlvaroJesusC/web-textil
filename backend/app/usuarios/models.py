from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RolUsuario(StrEnum):
    ADMINISTRADOR = "administrador"
    VENDEDOR = "vendedor"
    ALMACENERO = "almacenero"
    GERENTE = "gerente"


class EstadoUsuario(StrEnum):
    ACTIVO = "activo"
    INACTIVO = "inactivo"


class Usuario(Base):
    __tablename__ = "usuario"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    usuario: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    contrasena_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rol: Mapped[str] = mapped_column(String(20), default=RolUsuario.VENDEDOR.value, nullable=False)
    estado: Mapped[str] = mapped_column(
        String(20), default=EstadoUsuario.ACTIVO.value, nullable=False
    )

    # Control de seguridad (RF-05, RF-06)
    intentos_fallidos: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bloqueado_hasta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    debe_cambiar_clave: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

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
