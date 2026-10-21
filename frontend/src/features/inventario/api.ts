import { peticionApi } from '@/lib/api-client'
import type {
  Producto,
  ProductoListadoRespuesta,
  Categoria,
  ProductoCrearPeticion,
  ProductoActualizarPeticion,
  MovimientoInventario,
  EstadoStock,
} from '@/types'

export interface FiltrosProductos {
  skip?: number
  limit?: number
  q?: string
  categoria_id?: number
  estado_stock?: EstadoStock
  solo_activos?: boolean
}

export async function listarProductosApi(filtros: FiltrosProductos = {}): Promise<ProductoListadoRespuesta> {
  const params = new URLSearchParams()
  if (filtros.skip !== undefined) params.append('skip', String(filtros.skip))
  if (filtros.limit !== undefined) params.append('limit', String(filtros.limit))
  if (filtros.q) params.append('q', filtros.q)
  if (filtros.categoria_id) params.append('categoria_id', String(filtros.categoria_id))
  if (filtros.estado_stock) params.append('estado_stock', filtros.estado_stock)
  if (filtros.solo_activos !== undefined) params.append('solo_activos', String(filtros.solo_activos))

  const qs = params.toString()
  return peticionApi<ProductoListadoRespuesta>(`/inventario/productos${qs ? `?${qs}` : ''}`)
}

export async function listarCategoriasApi(): Promise<Categoria[]> {
  return peticionApi<Categoria[]>('/inventario/categorias')
}

export async function obtenerProductoApi(id: number): Promise<Producto> {
  return peticionApi<Producto>(`/inventario/productos/${id}`)
}

export async function crearProductoApi(datos: ProductoCrearPeticion): Promise<Producto> {
  return peticionApi<Producto>('/inventario/productos', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export async function actualizarProductoApi(id: number, datos: ProductoActualizarPeticion): Promise<Producto> {
  return peticionApi<Producto>(`/inventario/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  })
}

export interface IngresoStockDatos {
  cantidad: number
  proveedor?: string
  documento?: string
  motivo?: string
}

export async function registrarIngresoStockApi(id: number, datos: IngresoStockDatos): Promise<Producto> {
  return peticionApi<Producto>(`/inventario/productos/${id}/ingreso`, {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export interface AjusteStockDatos {
  nuevo_stock: number
  motivo: string
}

export async function registrarAjusteStockApi(id: number, datos: AjusteStockDatos): Promise<Producto> {
  return peticionApi<Producto>(`/inventario/productos/${id}/ajuste`, {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export async function obtenerKardexApi(productoId: number): Promise<MovimientoInventario[]> {
  return peticionApi<MovimientoInventario[]>(`/inventario/productos/${productoId}/kardex`)
}
