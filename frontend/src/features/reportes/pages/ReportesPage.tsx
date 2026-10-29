import React, { useState, useMemo } from 'react'
import {
  BarChart3,
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
  const d30 = new Date(hoy)
  d30.setDate(hoy.getDate() - 30)
  return { fecha_inicio: d30.toISOString().split('T')[0], fecha_fin: hoyStr }
}

const ETIQUETA_RANGO: Record<RangoPredefinido, string> = {
  hoy: 'Jornada de hoy',
  '7dias': 'Últimos 7 días',
  '30dias': 'Últimos 30 días',
  esteMes: 'Mes en curso',
}

export const ReportesPage: React.FC = () => {
  const [rango, setRango] = useState<RangoPredefinido>('30dias')
  const [pestanaActiva, setPestanaActiva] = useState<
    'tendencia' | 'topProductos' | 'metodosVendedores' | 'alertasStock'
  >('tendencia')

  const filtros = useMemo(() => obtenerFiltrosRango(rango), [rango])

  const { data: kpis, isLoading: cargandoKPIs } = useResumenKPIs(filtros)
  const { data: ventasPorDia = [], isLoading: cargandoDias } = useVentasPorDia(filtros)
  const { data: topProductos = [], isLoading: cargandoTop } = useProductosMasVendidos(10, filtros)
  const { data: ventasVendedor = [], isLoading: cargandoVendedores } = useVentasPorVendedor(filtros)
  const { data: metodosPago = [], isLoading: cargandoMetodos } = useVentasPorMetodoPago(filtros)
  const { data: alertasStock = [], isLoading: cargandoAlertas } = useAlertasStock()

  const totalIngresosNum = parseFloat(kpis?.total_ingresos || '0')
  const baseImponiblePeriodo = totalIngresosNum / 1.18
  const igvPeriodo = totalIngresosNum - baseImponiblePeriodo

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
    <div className="flex-1 flex flex-col">
      <Header
        titulo="Inteligencia Comercial y Rotación Textil"
        subtitulo="Estado de ingresos en Soles (S/), desglose de IGV 18% y velocidad de salida de mercadería"
      />

      <main className="p-6 space-y-5">
        {/* Panel Ejecutivo Integrado: Selector de Periodo + Estado de Resultados */}
        <section className="card-textil rounded-2xl border-t-[3px] border-t-[#D95D39] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E5E0D5] bg-gradient-to-b from-white to-[#FAF9F6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#1B2A4A]">
                Balance del periodo ({ETIQUETA_RANGO[rango]})
              </span>
              {filtros.fecha_inicio && (
                <span className="text-[11px] text-slate-500 tabular-nums">
                  · {filtros.fecha_inicio} al {filtros.fecha_fin}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              <div className="inline-flex items-center gap-1 pista-segmentos p-1 rounded-xl text-xs font-semibold">
                {(['hoy', '7dias', '30dias', 'esteMes'] as RangoPredefinido[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRango(r)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      rango === r
                        ? 'btn-indigo font-bold'
                        : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-white/60'
                    }`}
                  >
                    {r === 'hoy'
                      ? 'Hoy'
                      : r === '7dias'
                        ? '7 días'
                        : r === '30dias'
                          ? '30 días'
                          : 'Este mes'}
                  </button>
                ))}
              </div>

              <button
                onClick={exportarCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl btn-superficie shrink-0"
                title="Descargar ranking de rotación en CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#2452E8]" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* 4 Columnas Estructuradas del Estado de Resultados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E0D5]">
            <div className="lg:col-span-4 p-5">
              <span className="text-xs font-bold text-slate-500 block">
                Facturación Bruta Recaudada
              </span>
              <div className="text-3xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums mt-1">
                {cargandoKPIs ? '...' : formatearMoneda(kpis?.total_ingresos)}
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-[#E5E0D5]/70 flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                <span>
                  Base imponible: <strong className="text-[#1B2A4A]">{formatearMoneda(baseImponiblePeriodo)}</strong>
                </span>
                <span>
                  IGV 18%: <strong className="text-[#1B2A4A]">{formatearMoneda(igvPeriodo)}</strong>
                </span>
              </div>
            </div>

            <div className="lg:col-span-3 p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  Operaciones de Mostrador
                </span>
                <div className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums mt-1">
                  {cargandoKPIs ? '...' : `${kpis?.total_transacciones ?? 0} tickets`}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 tabular-nums">
                Ticket promedio:{' '}
                <strong className="text-[#2452E8] font-bold">
                  {formatearMoneda(kpis?.ticket_promedio)}
                </strong>
              </p>
            </div>

            <div className="lg:col-span-3 p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  Volumen Textil Despachado
                </span>
                <div className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums mt-1">
                  {cargandoKPIs ? '...' : `${kpis?.total_unidades ?? 0} uds.`}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 truncate">
                Mayor salida:{' '}
                <strong className="text-[#1B2A4A]">
                  {topProductos[0]?.categoria ?? 'Telas y avíos'}
                </strong>
              </p>
            </div>

            <div className="lg:col-span-2 p-5 flex flex-col justify-between bg-[#FAF9F6]">
              <div>
                <span className="text-xs font-bold text-slate-500 block">
                  Alerta de Stock
                </span>
                <div className="text-2xl font-extrabold text-[#D95D39] tracking-tight tabular-nums mt-1">
                  {cargandoKPIs
                    ? '...'
                    : (kpis?.productos_stock_bajo ?? 0) + (kpis?.productos_agotados ?? 0)}{' '}
                  SKUs
                </div>
              </div>
              <div className="text-[11px] text-slate-600 mt-2 tabular-nums">
                <span className="text-[#B91C1C] font-bold">
                  {kpis?.productos_agotados ?? 0} agot.
                </span>{' '}
                ·{' '}
                <span className="text-[#B45309] font-bold">
                  {kpis?.productos_stock_bajo ?? 0} bajos
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Navegación de Vistas Analíticas con Pestañas Táctiles */}
        <div className="inline-flex flex-wrap items-center gap-1.5 pista-segmentos p-1.5 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setPestanaActiva('tendencia')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              pestanaActiva === 'tendencia'
                ? 'btn-indigo font-bold'
                : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-white/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Curva de Ingresos y Medios de Cobro</span>
          </button>

          <button
            onClick={() => setPestanaActiva('topProductos')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              pestanaActiva === 'topProductos'
                ? 'btn-indigo font-bold'
                : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-white/60'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Ranking de Artículos Más Vendidos</span>
          </button>

          <button
            onClick={() => setPestanaActiva('metodosVendedores')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              pestanaActiva === 'metodosVendedores'
                ? 'btn-indigo font-bold'
                : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-white/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Productividad por Vendedor</span>
          </button>

          <button
            onClick={() => setPestanaActiva('alertasStock')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              pestanaActiva === 'alertasStock'
                ? 'btn-terracota font-bold'
                : 'text-slate-600 hover:text-[#D95D39] hover:bg-white/60'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Artículos para Reposición ({alertasStock.length})</span>
          </button>
        </div>

        {/* Contenido Analítico */}
        {pestanaActiva === 'tendencia' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 card-textil p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-[#1B2A4A]">
                    Evolución Diaria de Facturación
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ingresos confirmados por jornada en Soles (S/)
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F2F0EA] border border-[#E5E0D5] text-xs font-semibold text-slate-600 tabular-nums">
                  {ventasPorDia.length} jornadas activas
                </span>
              </div>
              <GraficoVentasTiempo datos={ventasPorDia} estaCargando={cargandoDias} />
            </div>

            <div className="lg:col-span-5 card-textil p-5 rounded-2xl">
              <div className="mb-4">
                <h3 className="text-sm font-extrabold text-[#1B2A4A]">
                  Distribución por Modalidad de Cobro
                </h3>
                <p className="text-xs text-slate-500">
                  Comparativa entre efectivo en caja y medios digitales
                </p>
              </div>
              <GraficoMetodosPago datos={metodosPago} estaCargando={cargandoMetodos} />
            </div>
          </div>
        )}

        {pestanaActiva === 'topProductos' && (
          <div className="card-textil rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E0D5] bg-gradient-to-b from-white to-[#FAF9F6] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#1B2A4A]">
                  Top 10 Telas, Hilados y Avíos de Mayor Rotación
                </h3>
                <p className="text-xs text-slate-500">
                  Clasificados por unidades despachadas e importe total recaudado
                </p>
              </div>
            </div>
            <TablaTopProductos productos={topProductos} estaCargando={cargandoTop} />
          </div>
        )}

        {pestanaActiva === 'metodosVendedores' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 card-textil rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E5E0D5] bg-gradient-to-b from-white to-[#FAF9F6]">
                <h3 className="text-sm font-extrabold text-[#1B2A4A]">
                  Rendimiento por Operador de Mostrador
                </h3>
                <p className="text-xs text-slate-500">
                  Tickets atendidos, recaudación acumulada y ticket promedio por asesor
                </p>
              </div>
              <TablaVendedores vendedores={ventasVendedor} estaCargando={cargandoVendedores} />
            </div>

            <div className="lg:col-span-5 card-textil p-5 rounded-2xl">
              <h3 className="text-sm font-extrabold text-[#1B2A4A]">
                Preferencia de Medios de Pago
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Volumen monetario según canal de cobro
              </p>
              <GraficoMetodosPago datos={metodosPago} estaCargando={cargandoMetodos} />
            </div>
          </div>
        )}

        {pestanaActiva === 'alertasStock' && (
          <div className="card-textil rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E0D5] bg-gradient-to-b from-white to-[#FAF9F6]">
              <h3 className="text-sm font-extrabold text-[#1B2A4A]">
                Artículos por Debajo del Stock de Seguridad
              </h3>
              <p className="text-xs text-slate-500">
                Relación de telas, conos y avíos que requieren orden de compra o reposición
              </p>
            </div>
            <TablaAlertasStock alertas={alertasStock} estaCargando={cargandoAlertas} />
          </div>
        )}
      </main>
    </div>
  )
}
