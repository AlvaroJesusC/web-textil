from fastapi import APIRouter, status

from app.auth.schemas import CambiarContrasenaPeticion, LoginPeticion, TokenRespuesta
from app.auth.service import autenticar_usuario, cambiar_contrasena
from app.core.dependencies import SesionBD, UsuarioActual
from app.usuarios.schemas import UsuarioRespuesta

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post(
    "/login",
    response_model=TokenRespuesta,
    summary="Iniciar sesión en el sistema",
    description=(
        "Autentica a un usuario mediante sus credenciales y genera un token JWT (RF-01, RF-06)."
    ),
)
def login(credenciales: LoginPeticion, db: SesionBD) -> TokenRespuesta:
    return autenticar_usuario(db, credenciales)


@router.get(
    "/me",
    response_model=UsuarioRespuesta,
    summary="Consultar usuario autenticado",
    description="Devuelve el perfil y permisos del usuario actualmente logueado.",
)
def obtener_perfil_actual(usuario_actual: UsuarioActual) -> UsuarioRespuesta:
    return UsuarioRespuesta.model_validate(usuario_actual)


@router.post(
    "/cambiar-contrasena",
    status_code=status.HTTP_200_OK,
    summary="Cambiar contraseña personal",
    description="Permite al usuario autenticado actualizar su contraseña (RF-05).",
)
def cambiar_clave(
    datos: CambiarContrasenaPeticion,
    usuario_actual: UsuarioActual,
    db: SesionBD,
) -> dict[str, str]:
    cambiar_contrasena(db, usuario_actual.id, datos)
    return {"mensaje": "Contraseña actualizada exitosamente."}
