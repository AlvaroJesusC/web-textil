import { useQuery } from '@tanstack/react-query'
import {
  obtenerAlertasStockApi,
  obtenerProductosMasVendidosApi,
  obtenerResumenKPIsApi,
  obtenerVentasPorDiaApi,
  obtenerVentasPorMetodoPagoApi,
  obtenerVentasPorVendedorApi,
  type FiltrosReporte,
} from './api'

export function useResumenKPIs(filtros: FiltrosReporte = {}) {
  return useQuery({
    queryKey: ['reportes-kpis', filtros],
    queryFn: () => obtenerResumenKPIsApi(filtros),
  })
}

export function useVentasPorDia(filtros: FiltrosReporte = {}) {
  return useQuery({
    queryKey: ['reportes-ventas-dia', filtros],
    queryFn: () => obtenerVentasPorDiaApi(filtros),
  })
}

export function useProductosMasVendidos(limit: number = 10, filtros: FiltrosReporte = {}) {
  return useQuery({
    queryKey: ['reportes-top-productos', limit, filtros],
    queryFn: () => obtenerProductosMasVendidosApi(limit, filtros),
  })
}

export function useVentasPorVendedor(filtros: FiltrosReporte = {}) {
  return useQuery({
    queryKey: ['reportes-vendedores', filtros],
    queryFn: () => obtenerVentasPorVendedorApi(filtros),
  })
}

export function useVentasPorMetodoPago(filtros: FiltrosReporte = {}) {
  return useQuery({
    queryKey: ['reportes-metodos-pago', filtros],
    queryFn: () => obtenerVentasPorMetodoPagoApi(filtros),
  })
}

export function useAlertasStock() {
  return useQuery({
    queryKey: ['reportes-alertas-stock'],
    queryFn: () => obtenerAlertasStockApi(),
  })
}
