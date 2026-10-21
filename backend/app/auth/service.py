from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.schemas import CambiarContrasenaPeticion, LoginPeticion, TokenRespuesta
from app.core.excepciones import (
    CredencialesInvalidasError,
    CuentaBloqueadaError,
    DatosInvalidosError,
    NoEncontradoError,
)
from app.core.security import (
    crear_token_acceso,
    hashear_contrasena,
    verificar_contrasena,
)
from app.usuarios.models import EstadoUsuario, Usuario
from app.usuarios.schemas import UsuarioRespuesta


def autenticar_usuario(db: Session, credenciales: LoginPeticion) -> TokenRespuesta:
    """Valida credenciales de acceso, maneja bloqueo por intentos fallidos
    y emite JWT (RF-01, RF-06).
    """
    stmt = select(Usuario).where(Usuario.usuario == credenciales.usuario.strip())
    usuario = db.scalar(stmt)

    if not usuario:
        # Mensaje genérico para no revelar si el usuario existe (RNF-25)
        raise CredencialesInvalidasError("Usuario o contraseña incorrectos.")

    ahora = datetime.now(UTC)
    if usuario.bloqueado_hasta:
        bloqueado = usuario.bloqueado_hasta
        if bloqueado.tzinfo is None:
            bloqueado = bloqueado.replace(tzinfo=UTC)
        if bloqueado > ahora:
            minutos_restantes = max(1, int((bloqueado - ahora).total_seconds() // 60))
            raise CuentaBloqueadaError(
                "La cuenta está bloqueada temporalmente. "
                f"Intente nuevamente en {minutos_restantes} minuto(s)."
            )

    es_valida = verificar_contrasena(credenciales.contrasena, usuario.contrasena_hash)

    if not es_valida:
        usuario.intentos_fallidos += 1
        if usuario.intentos_fallidos >= 5:
            usuario.bloqueado_hasta = ahora + timedelta(minutes=15)
            db.commit()
            raise CuentaBloqueadaError(
                "Ha alcanzado 5 intentos fallidos. Su cuenta ha sido bloqueada por 15 minutos."
            )
        db.commit()
        raise CredencialesInvalidasError("Usuario o contraseña incorrectos.")

    if usuario.estado != EstadoUsuario.ACTIVO.value:
        raise CredencialesInvalidasError(
            "El usuario se encuentra inactivo. Contacte al administrador."
        )

    # Reiniciar intentos al tener éxito
    usuario.intentos_fallidos = 0
    usuario.bloqueado_hasta = None
    db.commit()

    token = crear_token_acceso(
        {
            "sub": str(usuario.id),
            "rol": usuario.rol,
            "usuario": usuario.usuario,
            "nombre": usuario.nombre,
        }
    )

    return TokenRespuesta(
        access_token=token,
        token_type="bearer",
        usuario=UsuarioRespuesta.model_validate(usuario),
    )


def cambiar_contrasena(db: Session, usuario_id: int, datos: CambiarContrasenaPeticion) -> None:
    """Cambia la contraseña de un usuario validando la actual (RF-05)."""
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise NoEncontradoError("Usuario no encontrado.")

    if not verificar_contrasena(datos.contrasena_actual, usuario.contrasena_hash):
        raise DatosInvalidosError("La contraseña actual no es correcta.")

    if datos.contrasena_actual == datos.nueva_contrasena:
        raise DatosInvalidosError("La nueva contraseña no puede ser idéntica a la anterior.")

    usuario.contrasena_hash = hashear_contrasena(datos.nueva_contrasena)
    usuario.debe_cambiar_clave = False
    db.commit()
