import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Receipt,
  Scale,
  Layers,
  Wallet,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/features/auth'
import { listarProductosApi } from '@/features/inventario/api'
import { listarVentasApi } from '@/features/ventas/api'
import { formatearMoneda, formatearFecha } from '@/lib/formato'

const ETIQUETA_METODO: Record<string, { label: string; dot: string }> = {
  efectivo: { label: 'Efectivo', dot: 'bg-[#1B2A4A]' },
  yape_plin: { label: 'Yape / Plin', dot: 'bg-[#D95D39]' },
  tarjeta: { label: 'Tarjeta POS', dot: 'bg-[#15803D]' },
  transferencia: { label: 'Transferencia', dot: 'bg-[#2452E8]' },
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { tieneRol } = useAuth()

  const puedeVerVentas = tieneRol('administrador', 'vendedor', 'gerente')
  const puedeVerConciliacion = tieneRol('administrador', 'almacenero', 'gerente')

  const { data: productosData, isLoading: cargandoProductos } = useQuery({
    queryKey: ['productos-dashboard'],
    queryFn: () => listarProductosApi({ limit: 100 }),
  })

  const { data: ventasData, isLoading: cargandoVentas } = useQuery({
    queryKey: ['ventas-dashboard'],
    queryFn: () => listarVentasApi({ limit: 8 }),
    enabled: puedeVerVentas,
  })

  const productos = productosData?.items || []
  const productosActivos = productos.filter((p) => p.estado === 'activo')
  const productosBajoStock = productos
    .filter((p) => p.estado_stock === 'bajo' || p.estado_stock === 'agotado')
    .sort((a, b) => a.stock_actual - b.stock_actual)
  const productosAgotados = productos.filter((p) => p.estado_stock === 'agotado')
  const productosAlertaBaja = productos.filter((p) => p.estado_stock === 'bajo')

  const telasPorMetro = productosActivos.filter((p) => p.unidad === 'metro')
  const totalMetros = telasPorMetro.reduce((acc, p) => acc + p.stock_actual, 0)

  const hilosPorCono = productosActivos.filter((p) => p.unidad === 'cono')
  const totalConos = hilosPorCono.reduce((acc, p) => acc + p.stock_actual, 0)

  const aviosUnidades = productosActivos.filter(
    (p) => p.unidad === 'bolsa' || p.unidad === 'unidad'
  )
  const totalAvios = aviosUnidades.reduce((acc, p) => acc + p.stock_actual, 0)

  const ventas = ventasData?.items || []
  const ventasValidas = ventas.filter((v) => v.estado !== 'anulada')
  const totalVentasMonto = ventasValidas.reduce((acc, v) => acc + parseFloat(v.total || '0'), 0)
  const ticketPromedio =
    ventasValidas.length > 0 ? totalVentasMonto / ventasValidas.length : 0

  const montoEfectivo = ventasValidas
    .filter((v) => v.metodo_pago === 'efectivo')
    .reduce((acc, v) => acc + parseFloat(v.total || '0'), 0)
  const montoYapePlin = ventasValidas
    .filter((v) => v.metodo_pago === 'yape_plin')
    .reduce((acc, v) => acc + parseFloat(v.total || '0'), 0)
  const montoBancario = ventasValidas
    .filter((v) => v.metodo_pago === 'tarjeta' || v.metodo_pago === 'transferencia')
    .reduce((acc, v) => acc + parseFloat(v.total || '0'), 0)

  const baseBarra = Math.max(totalVentasMonto, 1)
  const pctEfectivo = Math.round((montoEfectivo / baseBarra) * 100)
  const pctYape = Math.round((montoYapePlin / baseBarra) * 100)
  const pctBancario = Math.max(0, 100 - pctEfectivo - pctYape)

  return (
    <div className="flex-1 flex flex-col">
      <Header
        titulo="Resumen Operativo de Tienda y Almacén"
        subtitulo="Arqueo de cobros en mostrador, disponibilidad por metraje y prioridades de reposición"
      />

      <main className="p-6 space-y-6">
        {/* Bloque Superior Asimétrico: Arqueo de Caja (7 cols) + Balance Físico Textil (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {puedeVerVentas && (
            <section className="lg:col-span-7 rounded-2xl card-textil border-t-[3px] border-t-[#D95D39] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <div className="w-7 h-7 rounded-lg bg-[#2452E8]/10 text-[#2452E8] flex items-center justify-center">
                        <Wallet className="w-3.5 h-3.5" />
                      </div>
                      <span>Arqueo de Mostrador (Últimos comprobantes válidos)</span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-baseline gap-3">
                      <span className="text-3xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">
                        {cargandoVentas ? '...' : formatearMoneda(totalVentasMonto)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F2F0EA] border border-[#E5E0D5] text-xs font-semibold text-slate-600 tabular-nums">
                        {ventasValidas.length} tickets · Promedio{' '}
                        <strong className="text-[#1B2A4A]">{formatearMoneda(ticketPromedio)}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate(tieneRol('administrador', 'gerente') ? '/reportes' : '/ventas')
                    }
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-superficie text-xs font-bold shrink-0"
                  >
                    <span>
                      {tieneRol('administrador', 'gerente') ? 'Ver reportes' : 'Ver historial'}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#2452E8] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </div>

                {/* Barra de proporción de cobros y Tarjetas Táctiles por Canal */}
                <div className="mt-5">
                  <div className="h-2.5 w-full rounded-full bg-[#ECE8DF] p-0.5 overflow-hidden flex gap-0.5 shadow-inner">
                    {totalVentasMonto > 0 && (
                      <>
                        <div
                          style={{ width: `${pctEfectivo}%` }}
                          className="bg-[#1B2A4A] h-full rounded-l-full transition-all duration-300"
                          title={`Efectivo: ${pctEfectivo}%`}
                        />
                        <div
                          style={{ width: `${pctYape}%` }}
                          className="bg-[#D95D39] h-full transition-all duration-300"
                          title={`Yape / Plin: ${pctYape}%`}
                        />
                        <div
                          style={{ width: `${pctBancario}%` }}
                          className="bg-[#2452E8] h-full rounded-r-full transition-all duration-300"
                          title={`Tarjeta / Transferencia: ${pctBancario}%`}
                        />
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div
                      onClick={() => navigate('/ventas')}
                      className="group p-3 rounded-xl bg-[#FAF9F6] hover:bg-white border border-[#E5E0D5] hover:border-[#1B2A4A]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1B2A4A] ring-2 ring-[#1B2A4A]/15" />
                          <span>Efectivo</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#1B2A4A] tabular-nums">
                          {pctEfectivo}%
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-[#1B2A4A] tabular-nums mt-1">
                        {formatearMoneda(montoEfectivo)}
                      </p>
                    </div>

                    <div
                      onClick={() => navigate('/ventas')}
                      className="group p-3 rounded-xl bg-[#FAF9F6] hover:bg-white border border-[#E5E0D5] hover:border-[#D95D39]/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#D95D39] ring-2 ring-[#D95D39]/20" />
                          <span>Yape / Plin</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#D95D39] tabular-nums">
                          {pctYape}%
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-[#1B2A4A] tabular-nums mt-1">
                        {formatearMoneda(montoYapePlin)}
                      </p>
                    </div>

                    <div
                      onClick={() => navigate('/ventas')}
                      className="group p-3 rounded-xl bg-[#FAF9F6] hover:bg-white border border-[#E5E0D5] hover:border-[#2452E8]/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#2452E8] ring-2 ring-[#2452E8]/20" />
                          <span>Tarjeta y Transf.</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#2452E8] tabular-nums">
                          {pctBancario}%
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-[#1B2A4A] tabular-nums mt-1">
                        {formatearMoneda(montoBancario)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Balance Físico del Almacén por Unidad Textil */}
          <section
            className={`${
              puedeVerVentas ? 'lg:col-span-5' : 'lg:col-span-12'
            } rounded-2xl card-textil border-t-[3px] border-t-[#1B2A4A] p-5 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <div className="w-7 h-7 rounded-lg bg-[#1B2A4A]/10 text-[#1B2A4A] flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span>Existencias Físicas ({productosActivos.length} SKUs)</span>
                </div>
                <button
                  onClick={() => navigate('/inventario')}
                  className="group inline-flex items-center gap-1 px-3 py-1.5 rounded-xl btn-superficie text-xs font-bold"
                >
                  <span>Catálogo</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#2452E8] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5 mt-4">
                <div
                  onClick={() => navigate('/inventario')}
                  className="group p-3.5 rounded-xl card-interactiva bg-gradient-to-b from-white to-[#FAF9F6]"
                >
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#2452E8] transition-colors block">
                    Telas (Metraje)
                  </span>
                  <span className="text-lg font-extrabold text-[#1B2A4A] tabular-nums block mt-1">
                    {cargandoProductos ? '...' : `${totalMetros} m`}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                    {telasPorMetro.length} tipos de tela
                  </span>
                </div>

                <div
                  onClick={() => navigate('/inventario')}
                  className="group p-3.5 rounded-xl card-interactiva bg-gradient-to-b from-white to-[#FAF9F6]"
                >
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#2452E8] transition-colors block">
                    Hilados (Conos)
                  </span>
                  <span className="text-lg font-extrabold text-[#1B2A4A] tabular-nums block mt-1">
                    {cargandoProductos ? '...' : `${totalConos} conos`}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                    {hilosPorCono.length} referencias
                  </span>
                </div>

                <div
                  onClick={() => navigate('/inventario')}
                  className="group p-3.5 rounded-xl card-interactiva bg-gradient-to-b from-white to-[#FAF9F6]"
                >
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#2452E8] transition-colors block">
                    Avíos / Insumos
                  </span>
                  <span className="text-lg font-extrabold text-[#1B2A4A] tabular-nums block mt-1">
                    {cargandoProductos ? '...' : `${totalAvios} und.`}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                    {aviosUnidades.length} referencias
                  </span>
                </div>
              </div>
            </div>

            {/* Pie de Estado de Reposición y Conciliación con Botones Táctiles */}
            <div className="mt-4 pt-3.5 border-t border-[#E5E0D5] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/inventario?estado_stock=agotado')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEE2E2]/70 hover:bg-[#FEE2E2] border border-[#DC2626]/20 font-bold text-[#B91C1C] transition-all hover:-translate-y-0.5 cursor-pointer tabular-nums"
                >
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                  <span>{productosAgotados.length} agotados</span>
                </button>
                <button
                  onClick={() => navigate('/inventario?estado_stock=bajo')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEF3C7]/80 hover:bg-[#FEF3C7] border border-[#D97706]/25 font-bold text-[#B45309] transition-all hover:-translate-y-0.5 cursor-pointer tabular-nums"
                >
                  <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                  <span>{productosAlertaBaja.length} stock mínimo</span>
                </button>
              </div>

              {puedeVerConciliacion && (
                <button
                  onClick={() => navigate('/conciliacion')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#DCFCE7]/70 hover:bg-[#DCFCE7] border border-[#15803D]/20 text-[11px] font-bold text-[#15803D] transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Tolerancia ≤ 2.0%</span>
                </button>
              )}
            </div>
          </section>
        </div>

        {/* Sección Inferior: Tabla Contable de Ventas Recientes (7 cols) y Prioridad de Reposición (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {puedeVerVentas && (
            <section className="lg:col-span-7 rounded-2xl card-textil overflow-hidden flex flex-col">
              <div className="px-5 py-3.5 border-b border-[#E5E0D5] bg-gradient-to-b from-white to-[#FAF9F6] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#1B2A4A]/10 text-[#1B2A4A] flex items-center justify-center">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-extrabold text-xs text-[#1B2A4A]">
                    Últimos Comprobantes de Mostrador
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/ventas')}
                  className="group inline-flex items-center gap-1 text-xs text-[#2452E8] hover:text-[#1B2A4A] font-bold transition-colors cursor-pointer"
                >
                  <span>Abrir libro de ventas</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              <div className="overflow-x-auto flex-1">
                {ventas.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs">
                    No se registran comprobantes emitidos en el turno actual.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F2F0EA]/80 border-b border-[#E5E0D5] text-[11px] font-bold text-[#1B2A4A]">
                        <th className="py-2.5 px-4">Comprobante</th>
                        <th className="py-2.5 px-4">Cliente / Hora</th>
                        <th className="py-2.5 px-4">Cobro</th>
                        <th className="py-2.5 px-4 text-right">Importe (S/)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E0D5]/60">
                      {ventas.map((v) => {
                        const esAnulada = v.estado === 'anulada'
                        const infoMetodo = ETIQUETA_METODO[v.metodo_pago] || {
                          label: v.metodo_pago,
                          dot: 'bg-slate-400',
                        }
                        return (
                          <tr
                            key={v.id}
                            onClick={() => navigate(`/ventas?venta_id=${v.id}`)}
                            className="group fila-interactiva cursor-pointer"
                          >
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-mono font-bold text-[#1B2A4A] group-hover:text-[#2452E8] transition-colors">
                                {v.numero}
                              </span>
                              {esAnulada && (
                                <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEE2E2] text-[#B91C1C]">
                                  Anulada
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-[#1B2A4A] truncate max-w-[200px]">
                                {v.cliente_nombre || 'Cliente de mostrador'}
                              </p>
                              <p className="text-[11px] text-slate-400 tabular-nums">
                                {formatearFecha(v.fecha)}
                              </p>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                <span className={`w-2 h-2 rounded-full ${infoMetodo.dot}`} />
                                {infoMetodo.label}
                              </span>
                            </td>
                            <td
                              className={`py-3 px-4 text-right font-extrabold tabular-nums whitespace-nowrap ${
                                esAnulada ? 'line-through text-slate-400' : 'text-[#1B2A4A]'
                              }`}
                            >
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <span>{formatearMoneda(v.total)}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-[#D95D39] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* Panel de Reposición Urgente de Almacén con barras de nivel de stock */}
          <section
            className={`${
              puedeVerVentas ? 'lg:col-span-5' : 'lg:col-span-12'
            } rounded-2xl card-textil overflow-hidden flex flex-col`}
          >
            <div className="px-5 py-3.5 border-b border-[#E5E0D5] bg-gradient-to-b from-white to-[#FAF9F6] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#D95D39]/12 text-[#D95D39] flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-extrabold text-xs text-[#1B2A4A]">
                  Prioridad de Reposición en Almacén
                </h3>
              </div>
              <button
                onClick={() => navigate('/inventario?estado_stock=bajo')}
                className="group inline-flex items-center gap-1 text-xs text-[#2452E8] hover:text-[#1B2A4A] font-bold transition-colors cursor-pointer"
              >
                <span>Filtrar en catálogo</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            <div className="divide-y divide-[#E5E0D5]/60 flex-1">
              {productosBajoStock.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs">
                  Todo el catálogo se encuentra sobre el umbral mínimo de seguridad.
                </div>
              ) : (
                productosBajoStock.slice(0, 6).map((p) => {
                  const agotado = p.stock_actual === 0
                  const minRef = Math.max(p.stock_minimo, 1)
                  const pctNivel = Math.min(100, Math.round((p.stock_actual / minRef) * 100))

                  return (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/inventario?q=${encodeURIComponent(p.sku)}`)}
                      className="group px-5 py-3.5 fila-interactiva cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-[#1B2A4A] bg-[#F2F0EA] group-hover:bg-[#1B2A4A] group-hover:text-white px-1.5 py-0.5 rounded transition-colors shrink-0">
                            {p.sku}
                          </span>
                          <span className="text-xs font-bold text-[#1B2A4A] group-hover:text-[#2452E8] transition-colors truncate">
                            {p.nombre}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-extrabold tabular-nums shrink-0 ${
                            agotado ? 'text-[#B91C1C]' : 'text-[#B45309]'
                          }`}
                        >
                          {agotado ? '0 (Agotado)' : `${p.stock_actual} ${p.unidad}s`}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-[#ECE8DF] rounded-full overflow-hidden shadow-inner">
                          <div
                            style={{ width: `${agotado ? 4 : pctNivel}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${
                              agotado ? 'bg-[#DC2626]' : 'bg-[#D97706]'
                            }`}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500 tabular-nums shrink-0">
                          Mín. <strong className="text-[#1B2A4A]">{p.stock_minimo}</strong>{' '}
                          {p.unidad}s
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
