from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import SesionBD, UsuarioActual, requiere_rol
from app.inventario.models import EstadoStock
from app.inventario.schemas import (
    AjusteStockPeticion,
    CategoriaCrear,
    CategoriaRespuesta,
    IngresoStockPeticion,
    MovimientoRespuesta,
    ProductoActualizar,
    ProductoCrear,
    ProductoListado,
    ProductoRespuesta,
)
from app.inventario.service import InventarioService
from app.usuarios.models import RolUsuario

router = APIRouter(prefix="/inventario", tags=["Inventario"])


@router.get(
    "/categorias",
    response_model=list[CategoriaRespuesta],
    summary="Listar categorías de productos",
    description="Obtiene todas las familias o categorías registradas (RF-15).",
)
def listar_categorias(
    db: SesionBD,
    _usuario: UsuarioActual,
) -> list[CategoriaRespuesta]:
    servicio = InventarioService(db)
    return servicio.listar_categorias()


@router.post(
    "/categorias",
    response_model=CategoriaRespuesta,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una categoría",
    dependencies=[Depends(requiere_rol(RolUsuario.ADMINISTRADOR, RolUsuario.ALMACENERO))],
)
def crear_categoria(
    datos: CategoriaCrear,
    db: SesionBD,
    _usuario: UsuarioActual,
) -> CategoriaRespuesta:
    servicio = InventarioService(db)
    return servicio.crear_categoria(datos)


@router.get(
    "/productos",
    response_model=ProductoListado,
    summary="Listar y buscar productos",
    description="Permite buscar por texto (nombre, SKU), categoría y estado de stock (RF-10).",
)
def listar_productos(
    db: SesionBD,
    _usuario: UsuarioActual,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    q: Annotated[str | None, Query(description="Buscar por nombre o SKU")] = None,
    categoria_id: Annotated[int | None, Query()] = None,
    estado_stock: Annotated[EstadoStock | None, Query()] = None,
    solo_activos: Annotated[bool, Query()] = False,
) -> ProductoListado:
    servicio = InventarioService(db)
    items, total = servicio.listar_productos(
        skip=skip,
        limit=limit,
        termino_busqueda=q,
        categoria_id=categoria_id,
        filtro_estado_stock=estado_stock,
        solo_activos=solo_activos,
    )
    pagina = (skip // limit) + 1
    return ProductoListado(items=items, total=total, pagina=pagina, por_pagina=limit)


@router.get(
    "/productos/{producto_id}",
    response_model=ProductoRespuesta,
    summary="Obtener detalle de un producto",
)
def obtener_producto(
    producto_id: int,
    db: SesionBD,
    _usuario: UsuarioActual,
) -> ProductoRespuesta:
    servicio = InventarioService(db)
    return servicio.obtener_producto(producto_id)


@router.post(
    "/productos",
    response_model=ProductoRespuesta,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un nuevo producto",
    description="Crea un producto textil validando campos y unicidad de SKU (RF-07).",
    dependencies=[Depends(requiere_rol(RolUsuario.ADMINISTRADOR, RolUsuario.ALMACENERO))],
)
def crear_producto(
    datos: ProductoCrear,
    db: SesionBD,
    usuario: UsuarioActual,
) -> ProductoRespuesta:
    servicio = InventarioService(db)
    return servicio.crear_producto(datos, usuario_id=usuario.id)


@router.put(
    "/productos/{producto_id}",
    response_model=ProductoRespuesta,
    summary="Actualizar datos de un producto",
    description="Permite modificar precio, categoría, nombre o estado (RF-08).",
    dependencies=[Depends(requiere_rol(RolUsuario.ADMINISTRADOR, RolUsuario.ALMACENERO))],
)
def actualizar_producto(
    producto_id: int,
    datos: ProductoActualizar,
    db: SesionBD,
    _usuario: UsuarioActual,
) -> ProductoRespuesta:
    servicio = InventarioService(db)
    return servicio.actualizar_producto(producto_id, datos)


@router.post(
    "/productos/{producto_id}/ingreso",
    response_model=ProductoRespuesta,
    summary="Registrar ingreso de mercadería a almacén",
    description="Aumenta el stock y genera registro en kardex (RF-11).",
    dependencies=[Depends(requiere_rol(RolUsuario.ADMINISTRADOR, RolUsuario.ALMACENERO))],
)
def registrar_ingreso(
    producto_id: int,
    datos: IngresoStockPeticion,
    db: SesionBD,
    usuario: UsuarioActual,
) -> ProductoRespuesta:
    servicio = InventarioService(db)
    return servicio.registrar_ingreso_stock(producto_id, datos, usuario_id=usuario.id)


@router.post(
    "/productos/{producto_id}/ajuste",
    response_model=ProductoRespuesta,
    summary="Ajustar stock manualmente",
    description="Ajusta el stock físico con motivo obligatorio (RF-12).",
    dependencies=[Depends(requiere_rol(RolUsuario.ADMINISTRADOR, RolUsuario.ALMACENERO))],
)
def registrar_ajuste(
    producto_id: int,
    datos: AjusteStockPeticion,
    db: SesionBD,
    usuario: UsuarioActual,
) -> ProductoRespuesta:
    servicio = InventarioService(db)
    return servicio.registrar_ajuste_stock(producto_id, datos, usuario_id=usuario.id)


@router.get(
    "/productos/{producto_id}/kardex",
    response_model=list[MovimientoRespuesta],
    summary="Consultar kardex / historial de movimientos del producto",
    description="Muestra ingresos, salidas por venta y ajustes del producto (RF-14).",
)
def consultar_kardex(
    producto_id: int,
    db: SesionBD,
    _usuario: UsuarioActual,
) -> list[MovimientoRespuesta]:
    servicio = InventarioService(db)
    return servicio.listar_kardex(producto_id)
