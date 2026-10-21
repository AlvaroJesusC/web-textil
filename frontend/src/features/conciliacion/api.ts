import { peticionApi } from '@/lib/api-client'
import type {
  ConteoFisico,
  ConteoFisicoListado,
  ItemConteoInput,
} from '@/types'

export async function listarConteosApi(estado?: string): Promise<ConteoFisicoListado[]> {
  const qs = estado ? `?estado=${estado}` : ''
  return peticionApi<ConteoFisicoListado[]>(`/conteos${qs}`)
}

export async function obtenerConteoApi(id: number): Promise<ConteoFisico> {
  return peticionApi<ConteoFisico>(`/conteos/${id}`)
}

export async function iniciarConteoApi(observaciones?: string): Promise<ConteoFisico> {
  return peticionApi<ConteoFisico>('/conteos', {
    method: 'POST',
    body: JSON.stringify({ observaciones: observaciones || null }),
  })
}

export async function guardarItemsConteoApi(
  id: number,
  items: ItemConteoInput[]
): Promise<ConteoFisico> {
  return peticionApi<ConteoFisico>(`/conteos/${id}/items`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })
}

export async function calcularDiferenciasApi(id: number): Promise<ConteoFisico> {
  return peticionApi<ConteoFisico>(`/conteos/${id}/calcular`, {
    method: 'POST',
  })
}

export async function cerrarConteoApi(id: number): Promise<ConteoFisico> {
  return peticionApi<ConteoFisico>(`/conteos/${id}/cerrar`, {
    method: 'POST',
  })
}

export interface AjustarStockRespuesta {
  conteo_id: number
  productos_ajustados: number
  mensaje: string
}

export async function ajustarStockConteoApi(
  id: number,
  motivo: string,
  producto_ids?: number[]
): Promise<AjustarStockRespuesta> {
  return peticionApi<AjustarStockRespuesta>(`/conteos/${id}/ajustar`, {
    method: 'POST',
    body: JSON.stringify({
      motivo,
      producto_ids: producto_ids || null,
    }),
  })
}
