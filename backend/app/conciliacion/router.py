from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.conciliacion.schemas import (
    ActualizarConteosRequest,
    AjustarStockConteoRequest,
    AjustarStockConteoRespuesta,
    ConteoCrearRequest,
    ConteoFisicoListado,
    ConteoFisicoRespuesta,
)
from app.conciliacion.service import ConciliacionService
from app.core.dependencies import SesionBD, UsuarioActual, requiere_rol
from app.usuarios.models import RolUsuario

router = APIRouter(prefix="/conteos", tags=["Conciliación de Stock"])


def get_conciliacion_service(db: SesionBD) -> ConciliacionService:
    return ConciliacionService(db)


ServicioConciliacion = Annotated[ConciliacionService, Depends(get_conciliacion_service)]


@router.post(
    "",
    response_model=ConteoFisicoRespuesta,
    status_code=status.HTTP_201_CREATED,
    summary="Iniciar nueva sesión de conteo físico (RF-27)",
    dependencies=[Depends(requiere_rol(RolUsuario.ADMINISTRADOR, RolUsuario.ALMACENERO))],
)
def iniciar_conteo(
    datos: ConteoCrearRequest,
    usuario: UsuarioActual,
    servicio: ServicioConciliacion,
) -> ConteoFisicoRespuesta:
    """Inicia una sesión de conteo físico tomando una captura inmutable del stock del sistema."""
    return servicio.iniciar_conteo(responsable=usuario, observaciones=datos.observaciones)


@router.get(
    "",
    response_model=list[ConteoFisicoListado],
    summary="Listar historial de conteos físicos",
    dependencies=[
        Depends(
            requiere_rol(
                RolUsuario.ADMINISTRADOR,
                RolUsuario.ALMACENERO,
                RolUsuario.GERENTE,
            )
        )
    ],
)
def listar_conteos(
    servicio: ServicioConciliacion,
    estado: Annotated[
        str | None, Query(description="Filtrar por estado: borrador o cerrado")
    ] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[ConteoFisicoListado]:
    """Lista los conteos físicos registrados con resumen de porcentaje de conformidad."""
    return servicio.listar_conteos(estado=estado, limit=limit)


@router.get(
    "/{conteo_id}",
    response_model=ConteoFisicoRespuesta,
    summary="Obtener detalle y productos de una sesión de conteo",
    dependencies=[
        Depends(
            requiere_rol(
                RolUsuario.ADMINISTRADOR,
                RolUsuario.ALMACENERO,
                RolUsuario.GERENTE,
            )
        )
    ],
)
def obtener_conteo(
    conteo_id: int,
    servicio: ServicioConciliacion,
) -> ConteoFisicoRespuesta:
    """Retorna todos los ítems de la sesión de conteo con el stock del sistema y físico."""
    return servicio.obtener_conteo(conteo_id)


@router.put(
    "/{conteo_id}/items",
    response_model=ConteoFisicoRespuesta,
    summary="Guardar conteos físicos ingresados por almacén (RN-08)",
    dependencies=[Depends(requiere_rol(RolUsuario.ADMINISTRADOR, RolUsuario.ALMACENERO))],
)
def actualizar_conteos_fisicos(
    conteo_id: int,
    datos: ActualizarConteosRequest,
    servicio: ServicioConciliacion,
) -> ConteoFisicoRespuesta:
    """Actualiza en borrador los valores físicos de los productos contados en almacén."""
    return servicio.actualizar_conteos_fisicos(conteo_id, datos.items)


@router.post(
    "/{conteo_id}/calcular",
    response_model=ConteoFisicoRespuesta,
    summary="Calcular porcentajes de diferencia y semáforo (RF-28)",
    dependencies=[Depends(requiere_rol(RolUsuario.ADMINISTRADOR, RolUsuario.ALMACENERO))],
)
def calcular_diferencias(
    conteo_id: int,
    servicio: ServicioConciliacion,
) -> ConteoFisicoRespuesta:
    """Calcula las diferencias porcentuales (RN-06/RN-07) y actualiza el semáforo de conformidad."""
    return servicio.calcular_diferencias(conteo_id)


@router.post(
    "/{conteo_id}/cerrar",
    response_model=ConteoFisicoRespuesta,
    summary="Cerrar sesión de conteo físico (F-04)",
    dependencies=[Depends(requiere_rol(RolUsuario.ADMINISTRADOR, RolUsuario.ALMACENERO))],
)
def cerrar_conteo(
    conteo_id: int,
    usuario: UsuarioActual,
    servicio: ServicioConciliacion,
) -> ConteoFisicoRespuesta:
    """Cierra y consolida la sesión de conteo para auditoría y archivo histórico."""
    return servicio.cerrar_conteo(conteo_id, usuario)


@router.post(
    "/{conteo_id}/ajustar",
    response_model=AjustarStockConteoRespuesta,
    summary="Ajustar stock del sistema al valor físico (RF-29)",
    dependencies=[Depends(requiere_rol(RolUsuario.ADMINISTRADOR))],
)
def ajustar_stock_al_conteo(
    conteo_id: int,
    datos: AjustarStockConteoRequest,
    usuario: UsuarioActual,
    servicio: ServicioConciliacion,
) -> AjustarStockConteoRespuesta:
    """Solo Administrador: ajusta inventario real al conteo registrando movimientos y bitácora."""
    return servicio.ajustar_stock_al_conteo(
        conteo_id=conteo_id,
        usuario=usuario,
        motivo=datos.motivo,
        producto_ids=datos.producto_ids,
    )
