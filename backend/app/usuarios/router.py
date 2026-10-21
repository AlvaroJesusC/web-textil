from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import SesionBD, requiere_rol
from app.usuarios.models import EstadoUsuario, RolUsuario
from app.usuarios.schemas import (
    UsuarioActualizar,
    UsuarioCrear,
    UsuarioListado,
    UsuarioRespuesta,
)
from app.usuarios.service import UsuarioService

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"],
    dependencies=[Depends(requiere_rol(RolUsuario.ADMINISTRADOR))],
)


@router.get(
    "",
    response_model=UsuarioListado,
    summary="Listar usuarios del sistema",
    description="Permite al Administrador listar y filtrar los usuarios (RF-04).",
)
def listar_usuarios(
    db: SesionBD,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    rol: RolUsuario | None = None,
    estado: EstadoUsuario | None = None,
) -> UsuarioListado:
    servicio = UsuarioService(db)
    items, total = servicio.listar_usuarios(skip=skip, limit=limit, rol=rol, estado=estado)
    return UsuarioListado(items=items, total=total)


@router.get(
    "/{usuario_id}",
    response_model=UsuarioRespuesta,
    summary="Obtener detalle de un usuario",
)
def obtener_usuario(usuario_id: int, db: SesionBD) -> UsuarioRespuesta:
    servicio = UsuarioService(db)
    return servicio.obtener_por_id(usuario_id)


@router.post(
    "",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nuevo usuario",
    description="Crea un usuario asignando credenciales y rol (RF-04).",
)
def crear_usuario(datos: UsuarioCrear, db: SesionBD) -> UsuarioRespuesta:
    servicio = UsuarioService(db)
    return servicio.crear_usuario(datos)


@router.put(
    "/{usuario_id}",
    response_model=UsuarioRespuesta,
    summary="Actualizar datos o estado de un usuario",
    description="Actualiza nombre, rol o activa/desactiva una cuenta (RF-04).",
)
def actualizar_usuario(usuario_id: int, datos: UsuarioActualizar, db: SesionBD) -> UsuarioRespuesta:
    servicio = UsuarioService(db)
    return servicio.actualizar_usuario(usuario_id, datos)


@router.post(
    "/{usuario_id}/restablecer-clave",
    status_code=status.HTTP_200_OK,
    summary="Restablecer contraseña de usuario",
    description="Asigna una contraseña temporal para el usuario (RF-05).",
)
def restablecer_clave(
    usuario_id: int,
    db: SesionBD,
    nueva_clave_temporal: Annotated[str, Query(min_length=8)] = "Temporal123!",
) -> dict[str, str]:
    servicio = UsuarioService(db)
    servicio.restablecer_contrasena(usuario_id, nueva_clave_temporal)
    return {"mensaje": "Contraseña temporal restablecida correctamente."}
