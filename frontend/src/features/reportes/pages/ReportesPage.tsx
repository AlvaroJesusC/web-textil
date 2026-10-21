import React, { useState, useMemo } from 'react'
import {
  BarChart3,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  Download,
} from 'lucide-react'
import {
  useAlertasStock,
  useProductosMasVendidos,
  useResumenKPIs,
  useVentasPorDia,
  useVentasPorMetodoPago,
  useVentasPorVendedor,
} from '../hooks'
import { GraficoVentasTiempo } from '../components/GraficoVentasTiempo'
import { GraficoMetodosPago } from '../components/GraficoMetodosPago'
import { TablaTopProductos } from '../components/TablaTopProductos'
import { TablaVendedores } from '../components/TablaVendedores'
import { TablaAlertasStock } from '../components/TablaAlertasStock'
import { formatearMoneda } from '@/lib/formato'

type RangoPredefinido = 'hoy' | '7dias' | '30dias' | 'esteMes'

function obtenerFiltrosRango(rango: RangoPredefinido): { fecha_inicio?: string; fecha_fin?: string } {
  const hoy = new Date()
  const hoyStr = hoy.toISOString().split('T')[0]

  if (rango === 'hoy') {
    return { fecha_inicio: hoyStr, fecha_fin: hoyStr }
  }
  if (rango === '7dias') {
    const d7 = new Date(hoy)
    d7.setDate(hoy.getDate() - 7)
    return { fecha_inicio: d7.toISOString().split('T')[0], fecha_fin: hoyStr }
  }
  if (rango === 'esteMes') {
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    return { fecha_inicio: inicioMes.toISOString().split('T')[0], fecha_fin: hoyStr }
  }
  // 30 días
  const d30 = new Date(hoy)
  d30.setDate(hoy.getDate() - 30)
  return { fecha_inicio: d30.toISOString().split('T')[0], fecha_fin: hoyStr }
}

export const ReportesPage: React.FC = () => {
  const [rango, setRango] = useState<RangoPredefinido>('30dias')
  const [pestanaActiva, setPestanaActiva] = useState<
    'tendencia' | 'topProductos' | 'metodosVendedores' | 'alertasStock'
  >('tendencia')

  // Calcular fechas de inicio y fin memorizadas según el selector
  const filtros = useMemo(() => obtenerFiltrosRango(rango), [rango])

  // Queries TanStack Query
  const { data: kpis, isLoading: cargandoKPIs } = useResumenKPIs(filtros)
  const { data: ventasPorDia = [], isLoading: cargandoDias } = useVentasPorDia(filtros)
  const { data: topProductos = [], isLoading: cargandoTop } = useProductosMasVendidos(10, filtros)
  const { data: ventasVendedor = [], isLoading: cargandoVendedores } = useVentasPorVendedor(filtros)
  const { data: metodosPago = [], isLoading: cargandoMetodos } = useVentasPorMetodoPago(filtros)
  const { data: alertasStock = [], isLoading: cargandoAlertas } = useAlertasStock()

  const exportarCSV = () => {
    if (!topProductos || topProductos.length === 0) return
    const cabeceras = ['SKU', 'Producto', 'Categoria', 'Unidad', 'Cantidad Vendida', 'Total Recaudado (S/)']
    const filas = topProductos.map((p) => [
      `"${p.sku}"`,
      `"${p.nombre}"`,
      `"${p.categoria}"`,
      `"${p.unidad}"`,
      p.cantidad_vendida,
      p.total_recaudado,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [cabeceras.join(','), ...filas.map((f) => f.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `reporte_ventas_textileria_${rango}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Filtro de Rango */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-blue-100 text-blue-900 border border-blue-200">
              Gestión Comercial e Inventario
            </span>
            <span className="text-xs font-mono text-slate-500">Módulo P-08</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reportes y Métricas de Ventas
          </h1>
          <p className="text-xs text-slate-600">
            Seguimiento de ingresos en soles (S/), rotación textil por metro/cono y rendimiento por vendedor.
          </p>
        </div>

        {/* Selector de Rango & Botón Exportar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg text-xs font-medium text-slate-700">
            <button
              onClick={() => setRango('hoy')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                rango === 'hoy' ? 'bg-white shadow-xs font-semibold text-blue-950' : 'hover:text-slate-900'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setRango('7dias')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                rango === '7dias' ? 'bg-white shadow-xs font-semibold text-blue-950' : 'hover:text-slate-900'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setRango('30dias')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                rango === '30dias' ? 'bg-white shadow-xs font-semibold text-blue-950' : 'hover:text-slate-900'
              }`}
            >
              30 Días
            </button>
            <button
              onClick={() => setRango('esteMes')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                rango === 'esteMes' ? 'bg-white shadow-xs font-semibold text-blue-950' : 'hover:text-slate-900'
              }`}
            >
              Este Mes
            </button>
          </div>

          <button
            onClick={exportarCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition"
            title="Descargar ranking de productos en CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tarjetas de KPIs Generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Ingresos */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Ingresos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {cargandoKPIs ? '...' : formatearMoneda(kpis?.total_ingresos)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ventas confirmadas (con IGV 18%)</p>
        </div>

        {/* Total Transacciones */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tickets Emitidos</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {cargandoKPIs ? '...' : kpis?.total_transacciones ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Comprobantes de venta</p>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ticket Promedio</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {cargandoKPIs ? '...' : formatearMoneda(kpis?.ticket_promedio)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Por cliente atendido</p>
        </div>

        {/* Unidades Textiles Vendidas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Unidades Vendidas</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {cargandoKPIs ? '...' : kpis?.total_unidades ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Metros, conos y prendas</p>
        </div>
      </div>

      {/* Pestañas de Visualización */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-semibold">
        <button
          onClick={() => setPestanaActiva('tendencia')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            pestanaActiva === 'tendencia'
              ? 'border-blue-800 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Tendencia de Ingresos Diarios
        </button>

        <button
          onClick={() => setPestanaActiva('topProductos')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            pestanaActiva === 'topProductos'
              ? 'border-blue-800 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Top Productos Más Vendidos
        </button>

        <button
          onClick={() => setPestanaActiva('metodosVendedores')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            pestanaActiva === 'metodosVendedores'
              ? 'border-blue-800 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Vendedores y Métodos de Pago
        </button>

        <button
          onClick={() => setPestanaActiva('alertasStock')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            pestanaActiva === 'alertasStock'
              ? 'border-blue-800 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Alertas de Stock ({alertasStock.length})
        </button>
      </div>

      {/* Contenido según la Pestaña Activa */}
      {pestanaActiva === 'tendencia' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Evolución Diaria de Ventas</h3>
                <p className="text-xs text-slate-500">Monto total facturado por día en Soles (S/)</p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {ventasPorDia.length} días con actividad
              </span>
            </div>
            <GraficoVentasTiempo datos={ventasPorDia} estaCargando={cargandoDias} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Medios de Pago Utilizados</h3>
              <p className="text-xs text-slate-500 mb-4">Participación de efectivo, Yape/Plin y tarjetas</p>
              <GraficoMetodosPago datos={metodosPago} estaCargando={cargandoMetodos} />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Resumen Operativo Textil</h3>
                <p className="text-xs text-slate-500 mb-4">Indicadores clave de inventario y rotación</p>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 font-medium">Productos con Stock Crítico</span>
                    <span className="font-bold font-mono text-amber-700">
                      {kpis?.productos_stock_bajo ?? 0} artículos
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 font-medium">Productos Totalmente Agotados</span>
                    <span className="font-bold font-mono text-rose-700">
                      {kpis?.productos_agotados ?? 0} artículos
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-600 font-medium">Línea Textil más Vendida</span>
                    <span className="font-bold text-blue-900">
                      {topProductos[0]?.categoria ?? 'Sin datos'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4 italic">
                * Las alertas se actualizan en tiempo real tras cada transacción o ajuste de almacén.
              </p>
            </div>
          </div>
        </div>
      )}

      {pestanaActiva === 'topProductos' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top 10 Artículos con Mayor Demanda</h3>
              <p className="text-xs text-slate-500">
                Ordenados por cantidad de unidades vendidas y recaudación acumulada
              </p>
            </div>
          </div>
          <TablaTopProductos productos={topProductos} estaCargando={cargandoTop} />
        </div>
      )}

      {pestanaActiva === 'metodosVendedores' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Ventas por Asesor Comercial</h3>
              <p className="text-xs text-slate-500">Métricas individuales del equipo de mostrador</p>
            </div>
            <TablaVendedores vendedores={ventasVendedor} estaCargando={cargandoVendedores} />
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Distribución por Método de Cobro</h3>
            <p className="text-xs text-slate-500 mb-4">Montos en Soles según la modalidad de pago</p>
            <GraficoMetodosPago datos={metodosPago} estaCargando={cargandoMetodos} />
          </div>
        </div>
      )}

      {pestanaActiva === 'alertasStock' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Productos en Estado Crítico</h3>
              <p className="text-xs text-slate-500">
                Artículos que alcanzaron el stock mínimo o se encuentran completamente agotados
              </p>
            </div>
          </div>
          <TablaAlertasStock alertas={alertasStock} estaCargando={cargandoAlertas} />
        </div>
      )}
    </div>
  )
}
