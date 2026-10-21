from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import SesionBD, UsuarioActual, requiere_rol
from app.usuarios.models import RolUsuario
from app.ventas.models import MetodoPago
from app.ventas.schemas import (
    AnularVentaPeticion,
    VentaCrear,
    VentaListado,
    VentaRespuesta,
)
from app.ventas.service import VentaService

router = APIRouter(prefix="/ventas", tags=["Ventas"])


@router.post(
    "",
    response_model=VentaRespuesta,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar una nueva venta (Transacción ACID)",
    description=(
        "Registra la venta calculando subtotal, descuento e IGV exacto, "
        "descuenta el stock en almacén y registra el movimiento en una "
        "transacción única (RF-19 a RF-23)."
    ),
    dependencies=[Depends(requiere_rol(RolUsuario.ADMINISTRADOR, RolUsuario.VENDEDOR))],
)
def registrar_venta(
    datos: VentaCrear,
    db: SesionBD,
    usuario: UsuarioActual,
) -> VentaRespuesta:
    servicio = VentaService(db)
    return servicio.registrar_venta(datos, vendedor=usuario)


@router.get(
    "",
    response_model=VentaListado,
    summary="Consultar historial de ventas",
    description="Permite listar y filtrar ventas según permisos de rol (RF-25).",
    dependencies=[
        Depends(
            requiere_rol(
                RolUsuario.ADMINISTRADOR,
                RolUsuario.VENDEDOR,
                RolUsuario.GERENTE,
            )
        )
    ],
)
def listar_ventas(
    db: SesionBD,
    usuario: UsuarioActual,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    metodo_pago: MetodoPago | None = None,
    vendedor_id: Annotated[
        int | None, Query(description="Filtrar por vendedor (admin/gerente)")
    ] = None,
) -> VentaListado:
    servicio = VentaService(db)
    items, total = servicio.listar_ventas(
        usuario_actual=usuario,
        skip=skip,
        limit=limit,
        metodo_pago=metodo_pago,
        vendedor_id=vendedor_id,
    )
    pagina = (skip // limit) + 1
    return VentaListado(items=items, total=total, pagina=pagina, por_pagina=limit)


@router.get(
    "/{venta_id}",
    response_model=VentaRespuesta,
    summary="Obtener detalle completo de una venta",
    dependencies=[
        Depends(
            requiere_rol(
                RolUsuario.ADMINISTRADOR,
                RolUsuario.VENDEDOR,
                RolUsuario.GERENTE,
            )
        )
    ],
)
def obtener_venta(
    venta_id: int,
    db: SesionBD,
    _usuario: UsuarioActual,
) -> VentaRespuesta:
    servicio = VentaService(db)
    return servicio.obtener_venta(venta_id)


@router.post(
    "/{venta_id}/anular",
    response_model=VentaRespuesta,
    summary="Anular una venta y reponer inventario",
    description="Permite al Administrador anular una venta con motivo obligatorio (RF-26, F-05).",
    dependencies=[Depends(requiere_rol(RolUsuario.ADMINISTRADOR))],
)
def anular_venta(
    venta_id: int,
    datos: AnularVentaPeticion,
    db: SesionBD,
    usuario: UsuarioActual,
) -> VentaRespuesta:
    servicio = VentaService(db)
    return servicio.anular_venta(venta_id, datos, usuario=usuario)
