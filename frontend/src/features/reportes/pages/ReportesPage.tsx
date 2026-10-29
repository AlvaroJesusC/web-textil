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
import { Header } from '@/components/layout/Header'
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

  // Calcular fechas de inicio y fin
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
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [cabeceras.join(','), ...filas.map((f) => f.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `reporte_ventas_textileria_${rango}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F9F8F5]">
      <Header
        titulo="Reportes y Métricas Analíticas"
        subtitulo="Rendimiento comercial en Soles (S/), rotación textil y auditoría de inventario"
      />

      <main className="p-6 space-y-5">
        {/* Barra superior: Selector de Rango & Botón Exportar */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E6E3DC] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#F2F0EA] p-1 rounded-lg text-xs font-medium text-[#5A6578]">
            <button
              onClick={() => setRango('hoy')}
              className={`px-3.5 py-1.5 rounded-md transition-all duration-150 ${
                rango === 'hoy'
                  ? 'bg-[#1B2A4A] text-white font-bold shadow-xs'
                  : 'hover:text-[#1B2A4A]'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setRango('7dias')}
              className={`px-3.5 py-1.5 rounded-md transition-all duration-150 ${
                rango === '7dias'
                  ? 'bg-[#1B2A4A] text-white font-bold shadow-xs'
                  : 'hover:text-[#1B2A4A]'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setRango('30dias')}
              className={`px-3.5 py-1.5 rounded-md transition-all duration-150 ${
                rango === '30dias'
                  ? 'bg-[#1B2A4A] text-white font-bold shadow-xs'
                  : 'hover:text-[#1B2A4A]'
              }`}
            >
              30 Días
            </button>
            <button
              onClick={() => setRango('esteMes')}
              className={`px-3.5 py-1.5 rounded-md transition-all duration-150 ${
                rango === 'esteMes'
                  ? 'bg-[#1B2A4A] text-white font-bold shadow-xs'
                  : 'hover:text-[#1B2A4A]'
              }`}
            >
              Este Mes
            </button>
          </div>

          <button
            onClick={exportarCSV}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#1B2A4A] bg-white hover:bg-[#F9F8F5] border border-[#E6E3DC] rounded-lg shadow-xs transition-all duration-150 shrink-0"
            title="Descargar ranking de productos en CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#2452E8]" />
            <span>Exportar CSV</span>
          </button>
        </div>

        {/* Tarjetas de KPIs Generales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Ingresos */}
          <div className="bg-white p-5 rounded-xl border border-[#E6E3DC] shadow-sm">
            <div className="flex items-center justify-between text-[#5A6578] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5A6578]">
                Total Ingresos
              </span>
              <div className="w-9 h-9 rounded-lg bg-[#2452E8]/10 flex items-center justify-center text-[#2452E8]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">
              {cargandoKPIs ? '...' : formatearMoneda(kpis?.total_ingresos)}
            </div>
            <p className="text-xs text-[#5A6578] mt-1">Con IGV 18% incluido</p>
          </div>

          {/* Total Transacciones */}
          <div className="bg-white p-5 rounded-xl border border-[#E6E3DC] shadow-sm">
            <div className="flex items-center justify-between text-[#5A6578] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5A6578]">
                Tickets Emitidos
              </span>
              <div className="w-9 h-9 rounded-lg bg-[#1B2A4A]/10 flex items-center justify-center text-[#1B2A4A]">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">
              {cargandoKPIs ? '...' : kpis?.total_transacciones ?? 0}
            </div>
            <p className="text-xs text-[#5A6578] mt-1">Comprobantes válidos</p>
          </div>

          {/* Ticket Promedio */}
          <div className="bg-white p-5 rounded-xl border border-[#E6E3DC] shadow-sm">
            <div className="flex items-center justify-between text-[#5A6578] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5A6578]">
                Ticket Promedio
              </span>
              <div className="w-9 h-9 rounded-lg bg-[#D95D39]/10 flex items-center justify-center text-[#D95D39]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">
              {cargandoKPIs ? '...' : formatearMoneda(kpis?.ticket_promedio)}
            </div>
            <p className="text-xs text-[#5A6578] mt-1">Por cliente atendido</p>
          </div>

          {/* Unidades Textiles Vendidas */}
          <div className="bg-white p-5 rounded-xl border border-[#E6E3DC] shadow-sm">
            <div className="flex items-center justify-between text-[#5A6578] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5A6578]">
                Unidades Vendidas
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">
              {cargandoKPIs ? '...' : kpis?.total_unidades ?? 0}
            </div>
            <p className="text-xs text-[#5A6578] mt-1">Metros, conos y avíos</p>
          </div>
        </div>

        {/* Pestañas de Visualización */}
        <div className="border-b border-[#E6E3DC] flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => setPestanaActiva('tendencia')}
            className={`pb-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              pestanaActiva === 'tendencia'
                ? 'border-[#D95D39] text-[#1B2A4A] font-bold'
                : 'border-transparent text-[#5A6578] hover:text-[#1B2A4A]'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#2452E8]" />
            <span>Tendencia de Ingresos</span>
          </button>

          <button
            onClick={() => setPestanaActiva('topProductos')}
            className={`pb-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              pestanaActiva === 'topProductos'
                ? 'border-[#D95D39] text-[#1B2A4A] font-bold'
                : 'border-transparent text-[#5A6578] hover:text-[#1B2A4A]'
            }`}
          >
            <Package className="w-4 h-4 text-[#1B2A4A]" />
            <span>Top Artículos Vendidos</span>
          </button>

          <button
            onClick={() => setPestanaActiva('metodosVendedores')}
            className={`pb-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              pestanaActiva === 'metodosVendedores'
                ? 'border-[#D95D39] text-[#1B2A4A] font-bold'
                : 'border-transparent text-[#5A6578] hover:text-[#1B2A4A]'
            }`}
          >
            <Users className="w-4 h-4 text-[#2452E8]" />
            <span>Vendedores y Medios de Pago</span>
          </button>

          <button
            onClick={() => setPestanaActiva('alertasStock')}
            className={`pb-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              pestanaActiva === 'alertasStock'
                ? 'border-[#D95D39] text-[#1B2A4A] font-bold'
                : 'border-transparent text-[#5A6578] hover:text-[#1B2A4A]'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            <span>Alertas de Stock ({alertasStock.length})</span>
          </button>
        </div>

        {/* Contenido según la Pestaña Activa */}
        {pestanaActiva === 'tendencia' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-[#E6E3DC] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider">
                    Evolución Diaria de Ventas
                  </h3>
                  <p className="text-[11px] text-[#5A6578]">Monto total facturado por fecha en Soles (S/)</p>
                </div>
                <span className="text-[11px] font-semibold text-[#5A6578] tabular-nums">
                  {ventasPorDia.length} fechas con transacciones
                </span>
              </div>
              <GraficoVentasTiempo datos={ventasPorDia} estaCargando={cargandoDias} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-[#E6E3DC] shadow-sm">
                <h3 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider mb-0.5">
                  Participación por Medio de Pago
                </h3>
                <p className="text-[11px] text-[#5A6578] mb-3">Recaudación en efectivo, Yape/Plin, tarjetas y transferencias</p>
                <GraficoMetodosPago datos={metodosPago} estaCargando={cargandoMetodos} />
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#E6E3DC] shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider mb-0.5">
                    Resumen Operativo de Almacén
                  </h3>
                  <p className="text-[11px] text-[#5A6578] mb-3">Indicadores de rotación y disponibilidad textil</p>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#F9F8F5] border border-[#E6E3DC]">
                      <span className="text-[#5A6578] font-medium">Artículos con Stock Crítico</span>
                      <span className="font-bold text-[#B45309] tabular-nums">
                        {kpis?.productos_stock_bajo ?? 0} artículos
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#F9F8F5] border border-[#E6E3DC]">
                      <span className="text-[#5A6578] font-medium">Artículos Totalmente Agotados</span>
                      <span className="font-bold text-[#B91C1C] tabular-nums">
                        {kpis?.productos_agotados ?? 0} artículos
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#F9F8F5] border border-[#E6E3DC]">
                      <span className="text-[#5A6578] font-medium">Familia Textil con Mayor Demanda</span>
                      <span className="font-bold text-[#1B2A4A]">
                        {topProductos[0]?.categoria ?? 'Sin datos'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-[#5A6578] mt-3">
                  Sincronizado en tiempo real con Kardex y ventas.
                </p>
              </div>
            </div>
          </div>
        )}

        {pestanaActiva === 'topProductos' && (
          <div className="bg-white rounded-xl border border-[#E6E3DC] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E6E3DC] bg-[#F2F0EA]/60">
              <h3 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider">
                Top 10 Artículos de Mayor Demanda
              </h3>
              <p className="text-[11px] text-[#5A6578]">
                Ordenados por volumen de salida y monto de recaudación
              </p>
            </div>
            <TablaTopProductos productos={topProductos} estaCargando={cargandoTop} />
          </div>
        )}

        {pestanaActiva === 'metodosVendedores' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#E6E3DC] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E6E3DC] bg-[#F2F0EA]/60">
                <h3 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider">
                  Rendimiento por Asesor de Mostrador
                </h3>
                <p className="text-[11px] text-[#5A6578]">Comprobantes emitidos y recaudación por vendedor</p>
              </div>
              <TablaVendedores vendedores={ventasVendedor} estaCargando={cargandoVendedores} />
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E6E3DC] shadow-sm">
              <h3 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider mb-0.5">
                Distribución por Medio de Cobro
              </h3>
              <p className="text-[11px] text-[#5A6578] mb-3">Montos en Soles según modalidad de pago</p>
              <GraficoMetodosPago datos={metodosPago} estaCargando={cargandoMetodos} />
            </div>
          </div>
        )}

        {pestanaActiva === 'alertasStock' && (
          <div className="bg-white rounded-xl border border-[#E6E3DC] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E6E3DC] bg-[#F2F0EA]/60">
              <h3 className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider">
                Artículos en Estado Crítico de Inventario
              </h3>
              <p className="text-[11px] text-[#5A6578]">
                Existencias por debajo del stock de seguridad o en cero
              </p>
            </div>
            <TablaAlertasStock alertas={alertasStock} estaCargando={cargandoAlertas} />
          </div>
        )}
      </main>
    </div>
  )
}
