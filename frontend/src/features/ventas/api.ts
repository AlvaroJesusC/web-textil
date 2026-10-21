import { peticionApi } from '@/lib/api-client'
import type {
  Venta,
  VentaListadoRespuesta,
  VentaCrearPeticion,
  MetodoPago,
} from '@/types'

export interface FiltrosVentas {
  skip?: number
  limit?: number
  metodo_pago?: MetodoPago
  vendedor_id?: number
}

export async function registrarVentaApi(datos: VentaCrearPeticion): Promise<Venta> {
  return peticionApi<Venta>('/ventas', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export async function listarVentasApi(filtros: FiltrosVentas = {}): Promise<VentaListadoRespuesta> {
  const params = new URLSearchParams()
  if (filtros.skip !== undefined) params.append('skip', String(filtros.skip))
  if (filtros.limit !== undefined) params.append('limit', String(filtros.limit))
  if (filtros.metodo_pago) params.append('metodo_pago', filtros.metodo_pago)
  if (filtros.vendedor_id) params.append('vendedor_id', String(filtros.vendedor_id))

  const qs = params.toString()
  return peticionApi<VentaListadoRespuesta>(`/ventas${qs ? `?${qs}` : ''}`)
}

export async function obtenerVentaApi(id: number): Promise<Venta> {
  return peticionApi<Venta>(`/ventas/${id}`)
}

export async function anularVentaApi(id: number, motivo: string): Promise<Venta> {
  return peticionApi<Venta>(`/ventas/${id}/anular`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  })
}
