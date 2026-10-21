from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from app.core.config import settings


def hashear_contrasena(contrasena_plana: str) -> str:
    """Genera el hash seguro BCrypt de una contraseña (RNF-22)."""
    salt = bcrypt.gensalt()
    hash_bytes = bcrypt.hashpw(contrasena_plana.encode("utf-8"), salt)
    return hash_bytes.decode("utf-8")


def verificar_contrasena(contrasena_plana: str, contrasena_hasheada: str) -> bool:
    """Comprueba si una contraseña en texto plano coincide con su hash BCrypt."""
    try:
        return bcrypt.checkpw(
            contrasena_plana.encode("utf-8"),
            contrasena_hasheada.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def crear_token_acceso(datos: dict[str, Any], expira_en: timedelta | None = None) -> str:
    """Crea un token JWT firmado con expiración (RNF-23)."""
    payload = datos.copy()
    ahora = datetime.now(UTC)
    if expira_en:
        expira = ahora + expira_en
    else:
        expira = ahora + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload.update({"exp": expira, "iat": ahora})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decodificar_token_acceso(token: str) -> dict[str, Any]:
    """Decodifica y valida un token JWT; lanza jwt.PyJWTError si es inválido o expiró."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
