from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.usuarios.models import EstadoUsuario, RolUsuario


class UsuarioBase(BaseModel):
    nombre: str = Field(
        ..., min_length=2, max_length=100, description="Nombre completo del usuario"
    )
    usuario: str = Field(..., min_length=3, max_length=50, description="Nombre de usuario único")
    rol: RolUsuario = Field(
        default=RolUsuario.VENDEDOR, description="Rol del usuario en el sistema"
    )


class UsuarioCrear(UsuarioBase):
    contrasena: str = Field(
        ..., min_length=8, description="Contraseña de acceso inicial (mínimo 8 caracteres)"
    )


class UsuarioActualizar(BaseModel):
    nombre: str | None = Field(None, min_length=2, max_length=100)
    rol: RolUsuario | None = None
    estado: EstadoUsuario | None = None


class UsuarioRespuesta(UsuarioBase):
    id: int
    estado: str
    debe_cambiar_clave: bool
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)


class UsuarioListado(BaseModel):
    items: list[UsuarioRespuesta]
    total: int
