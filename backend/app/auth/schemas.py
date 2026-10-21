from pydantic import BaseModel, Field

from app.usuarios.schemas import UsuarioRespuesta


class LoginPeticion(BaseModel):
    usuario: str = Field(..., min_length=1, description="Nombre de usuario registrado")
    contrasena: str = Field(..., min_length=1, description="Contraseña del usuario")


class TokenRespuesta(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioRespuesta


class CambiarContrasenaPeticion(BaseModel):
    contrasena_actual: str = Field(..., min_length=1)
    nueva_contrasena: str = Field(
        ..., min_length=8, description="Nueva contraseña (mínimo 8 caracteres)"
    )
