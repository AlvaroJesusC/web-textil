from datetime import UTC, datetime
from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.excepciones import (
    CredencialesInvalidasError,
    CuentaBloqueadaError,
    PermisoDenegadoError,
)
from app.usuarios.models import EstadoUsuario, RolUsuario, Usuario

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
    auto_error=False,
)

SesionBD = Annotated[Session, Depends(get_db)]


def get_usuario_actual(
    db: SesionBD,
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> Usuario:
    """Valida el token JWT e inyecta la instancia del usuario autenticado."""
    if not token:
        raise CredencialesInvalidasError("Se requiere iniciar sesión para acceder a este recurso.")

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        usuario_id_str = payload.get("sub")
        if usuario_id_str is None:
            raise CredencialesInvalidasError("Token inválido: falta identificador de usuario.")
        usuario_id = int(usuario_id_str)
    except (jwt.PyJWTError, ValueError) as err:
        raise CredencialesInvalidasError("Token de sesión expirado o inválido.") from err

    stmt = select(Usuario).where(Usuario.id == usuario_id)
    usuario = db.scalar(stmt)

    if not usuario:
        raise CredencialesInvalidasError("El usuario asociado al token no existe.")

    if usuario.estado != EstadoUsuario.ACTIVO.value:
        raise CredencialesInvalidasError(
            "El usuario se encuentra inactivo. Contacte al administrador."
        )

    if usuario.bloqueado_hasta:
        ahora = datetime.now(UTC)
        bloqueado = usuario.bloqueado_hasta
        if bloqueado.tzinfo is None:
            bloqueado = bloqueado.replace(tzinfo=UTC)
        if bloqueado > ahora:
            raise CuentaBloqueadaError(
                "La cuenta se encuentra bloqueada temporalmente por reiterados intentos fallidos."
            )

    return usuario


UsuarioActual = Annotated[Usuario, Depends(get_usuario_actual)]


def requiere_rol(*roles_permitidos: RolUsuario | str):
    """Dependencia para validar en el servidor los permisos por rol (RNF-24)."""
    roles_str = [r.value if hasattr(r, "value") else str(r) for r in roles_permitidos]

    def _validador(usuario: UsuarioActual) -> Usuario:
        if usuario.rol not in roles_str:
            raise PermisoDenegadoError(
                "No tiene permisos para realizar esta acción. "
                f"Roles requeridos: {', '.join(roles_str)}."
            )
        return usuario

    return _validador
