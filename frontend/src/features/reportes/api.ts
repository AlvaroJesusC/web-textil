import { peticionApi } from '@/lib/api-client'
import type {
  AlertaStockItem,
  ProductoMasVendidoItem,
  ResumenVentasKPIs,
  VentaPorDiaItem,
  VentaPorMetodoPagoItem,
  VentaPorVendedorItem,
} from '@/types'

export interface FiltrosReporte {
  fecha_inicio?: string
  fecha_fin?: string
}

function generarQueryString(filtros: FiltrosReporte = {}, extraParams: Record<string, string | number> = {}): string {
  const params = new URLSearchParams()
  if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio)
  if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin)
  Object.entries(extraParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.append(k, String(v))
  })
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export async function obtenerResumenKPIsApi(filtros: FiltrosReporte = {}): Promise<ResumenVentasKPIs> {
  return peticionApi<ResumenVentasKPIs>(`/reportes/resumen${generarQueryString(filtros)}`)
}

export async function obtenerVentasPorDiaApi(filtros: FiltrosReporte = {}): Promise<VentaPorDiaItem[]> {
  return peticionApi<VentaPorDiaItem[]>(`/reportes/ventas-por-dia${generarQueryString(filtros)}`)
}

export async function obtenerProductosMasVendidosApi(
  limit: number = 10,
  filtros: FiltrosReporte = {}
): Promise<ProductoMasVendidoItem[]> {
  return peticionApi<ProductoMasVendidoItem[]>(
    `/reportes/productos-mas-vendidos${generarQueryString(filtros, { limit })}`
  )
}

export async function obtenerVentasPorVendedorApi(
  filtros: FiltrosReporte = {}
): Promise<VentaPorVendedorItem[]> {
  return peticionApi<VentaPorVendedorItem[]>(
    `/reportes/ventas-por-vendedor${generarQueryString(filtros)}`
  )
}

export async function obtenerVentasPorMetodoPagoApi(
  filtros: FiltrosReporte = {}
): Promise<VentaPorMetodoPagoItem[]> {
  return peticionApi<VentaPorMetodoPagoItem[]>(
    `/reportes/ventas-por-metodo-pago${generarQueryString(filtros)}`
  )
}

export async function obtenerAlertasStockApi(): Promise<AlertaStockItem[]> {
  return peticionApi<AlertaStockItem[]>('/reportes/alertas-stock')
}
