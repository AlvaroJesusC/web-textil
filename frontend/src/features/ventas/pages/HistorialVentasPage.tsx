import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/features/auth'
import { listarVentasApi, anularVentaApi, obtenerVentaApi } from '../api'
import type { Venta, MetodoPago } from '@/types'
import { formatearMoneda, formatearFecha } from '@/lib/formato'
import { ComprobanteModal } from '../components/ComprobanteModal'
import { AnularVentaModal } from '../components/AnularVentaModal'
import {
  Receipt,
  FileText,
  Ban,
  Loader2,
} from 'lucide-react'

const INFO_METODO: Record<string, { nombre: string; color: string }> = {
  efectivo: { nombre: 'Efectivo', color: 'bg-[#1B2A4A]' },
  yape_plin: { nombre: 'Yape / Plin', color: 'bg-[#D95D39]' },
  tarjeta: { nombre: 'Tarjeta POS', color: 'bg-[#15803D]' },
  transferencia: { nombre: 'Transferencia', color: 'bg-[#2452E8]' },
}

export const HistorialVentasPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { tieneRol } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [metodoPago, setMetodoPago] = useState<MetodoPago | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const porPagina = 20

  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null)
  const [modalComprobanteAbierto, setModalComprobanteAbierto] = useState(false)

  const [ventaAAnular, setVentaAAnular] = useState<Venta | null>(null)
  const [modalAnularAbierto, setModalAnularAbierto] = useState(false)

  const { data: ventasData, isLoading } = useQuery({
    queryKey: ['ventas', pagina, metodoPago],
    queryFn: () =>
      listarVentasApi({
        skip: (pagina - 1) * porPagina,
        limit: porPagina,
        metodo_pago: metodoPago,
      }),
  })

  useEffect(() => {
    const ventaIdParam = searchParams.get('venta_id')
    if (!ventaIdParam) return
    const idNum = Number(ventaIdParam)
    if (isNaN(idNum) || idNum <= 0) return

    obtenerVentaApi(idNum)
      .then((v) => {
        setVentaDetalle(v)
        setModalComprobanteAbierto(true)
      })
      .catch(() => {
        // Ignorar si la venta no existe o no es accesible
      })
  }, [searchParams])

  const anularMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => anularVentaApi(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
      queryClient.invalidateQueries({ queryKey: ['ventas-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-pos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['kardex'] })
      queryClient.invalidateQueries({ queryKey: ['reportes-kpis'] })
      queryClient.invalidateQueries({ queryKey: ['reportes-ventas-dia'] })
      queryClient.invalidateQueries({ queryKey: ['reportes-top-productos'] })
      queryClient.invalidateQueries({ queryKey: ['reportes-vendedores'] })
      queryClient.invalidateQueries({ queryKey: ['reportes-metodos-pago'] })
      queryClient.invalidateQueries({ queryKey: ['reportes-alertas-stock'] })
    },
  })

  const ventas = ventasData?.items || []
  const total = ventasData?.total || 0
  const totalPaginas = Math.ceil(total / porPagina) || 1

  const ventasValidasVista = ventas.filter((v) => v.estado !== 'anulada')
  const sumaIgvVista = ventasValidasVista.reduce((acc, v) => acc + parseFloat(v.igv || '0'), 0)
  const sumaTotalVista = ventasValidasVista.reduce((acc, v) => acc + parseFloat(v.total || '0'), 0)

  const abrirDetalle = (v: Venta) => {
    setVentaDetalle(v)
    setModalComprobanteAbierto(true)
  }

  const abrirAnular = (v: Venta) => {
    setVentaAAnular(v)
    setModalAnularAbierto(true)
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        titulo="Libro de Ventas y Comprobantes"
        subtitulo="Registro cronológico de despachos, desglose tributario (IGV 18%) y reversiones de almacén"
      />

      <main className="p-6 space-y-5">
        {/* Barra de Filtros por Modalidad con Pista Táctil y Arqueo de Página */}
        <div className="card-textil p-4 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 mr-1">
              Modalidad de cobro:
            </span>
            <div className="inline-flex flex-wrap items-center gap-1 pista-segmentos p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMetodoPago(undefined)
                  setPagina(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  metodoPago === undefined
                    ? 'btn-indigo font-bold'
                    : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-white/60'
                }`}
              >
                Todos ({total})
              </button>
              <button
                type="button"
                onClick={() => {
                  setMetodoPago('efectivo')
                  setPagina(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  metodoPago === 'efectivo'
                    ? 'btn-indigo font-bold'
                    : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-white/60'
                }`}
              >
                Efectivo
              </button>
              <button
                type="button"
                onClick={() => {
                  setMetodoPago('yape_plin')
                  setPagina(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  metodoPago === 'yape_plin'
                    ? 'btn-terracota font-bold'
                    : 'text-slate-600 hover:text-[#D95D39] hover:bg-white/60'
                }`}
              >
                Yape / Plin
              </button>
              <button
                type="button"
                onClick={() => {
                  setMetodoPago('tarjeta')
                  setPagina(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  metodoPago === 'tarjeta'
                    ? 'bg-[#15803D] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-[#15803D] hover:bg-white/60'
                }`}
              >
                Tarjeta POS
              </button>
              <button
                type="button"
                onClick={() => {
                  setMetodoPago('transferencia')
                  setPagina(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  metodoPago === 'transferencia'
                    ? 'btn-cobalto font-bold'
                    : 'text-slate-600 hover:text-[#2452E8] hover:bg-white/60'
                }`}
              >
                Transferencia
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs border-t lg:border-t-0 pt-2.5 lg:pt-0 border-[#E5E0D5] w-full lg:w-auto justify-end">
            <div className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E5E0D5]">
              <span className="text-slate-500">IGV (18%):</span>{' '}
              <span className="font-bold text-[#1B2A4A] tabular-nums">
                {formatearMoneda(sumaIgvVista)}
              </span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-[#1B2A4A]/5 border border-[#1B2A4A]/15">
              <span className="text-slate-600 font-medium">Total válido:</span>{' '}
              <span className="text-sm font-extrabold text-[#1B2A4A] tabular-nums">
                {formatearMoneda(sumaTotalVista)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla Contable de Comprobantes */}
        <div className="card-textil rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gradient-to-b from-[#F5F3EE] to-[#ECE8DF] border-b border-[#DED9CE] text-[#1B2A4A] font-bold text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Comprobante</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Emisión</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Cliente / Taller</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Atendido por</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Modalidad</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Subtotal</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">IGV (18%)</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Importe Total</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Estado</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D5]/70">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#2452E8]" />
                        <span className="font-semibold text-xs text-[#1B2A4A]">
                          Cargando libro de ventas...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : ventas.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-[#1B2A4A]">
                        No se encontraron comprobantes con este filtro
                      </p>
                    </td>
                  </tr>
                ) : (
                  ventas.map((v) => {
                    const esAnulada = v.estado === 'anulada'
                    const infoMetodo = INFO_METODO[v.metodo_pago] || {
                      nombre: v.metodo_pago,
                      color: 'bg-slate-400',
                    }
                    return (
                      <tr
                        key={v.id}
                        className={`group fila-interactiva h-12 ${
                          esAnulada ? 'bg-[#FEE2E2]/20 text-slate-400' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-[#1B2A4A] bg-[#F2F0EA] group-hover:bg-[#1B2A4A] group-hover:text-white px-2 py-0.5 rounded-md transition-colors text-xs">
                            {v.numero}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 tabular-nums text-[11px] whitespace-nowrap">
                          {formatearFecha(v.fecha)}
                        </td>
                        <td className="py-2.5 px-4">
                          {v.cliente_nombre ? (
                            <div>
                              <p className="font-semibold text-[#1B2A4A]">{v.cliente_nombre}</p>
                              {v.cliente_documento && (
                                <p className="text-[10px] text-slate-400 font-mono">
                                  Doc: {v.cliente_documento}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">Mostrador general</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                          {v.vendedor_nombre || `Operador #${v.vendedor_id}`}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-[#1B2A4A]">
                            <span className={`w-2 h-2 rounded-full ${infoMetodo.color}`} />
                            {infoMetodo.nombre}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-600 font-medium whitespace-nowrap">
                          {formatearMoneda(v.subtotal)}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-600 font-medium whitespace-nowrap">
                          {formatearMoneda(v.igv)}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right font-extrabold tabular-nums whitespace-nowrap ${
                            esAnulada ? 'line-through text-slate-400' : 'text-[#1B2A4A]'
                          }`}
                        >
                          {formatearMoneda(v.total)}
                        </td>
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          {esAnulada ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FEE2E2] text-[#B91C1C]">
                              Anulada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#15803D]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                              Válido
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              title="Ver e imprimir comprobante"
                              onClick={() => abrirDetalle(v)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg btn-superficie"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#2452E8]" />
                              <span>Ticket</span>
                            </button>

                            {tieneRol('administrador') && !esAnulada && (
                              <button
                                title="Anular comprobante y reponer stock al almacén"
                                onClick={() => abrirAnular(v)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-[#DC2626] bg-white hover:bg-[#DC2626] hover:text-white border border-[#DC2626]/25 rounded-lg transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Anular</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {total > porPagina && (
            <div className="p-3.5 bg-[#F2F0EA]/70 border-t border-[#E5E0D5] flex items-center justify-between text-xs text-slate-600">
              <div>
                Mostrando <span className="font-bold text-[#1B2A4A]">{ventas.length}</span> de{' '}
                <span className="font-bold text-[#1B2A4A]">{total}</span> comprobantes
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold btn-superficie"
                >
                  Anterior
                </button>
                <span className="font-bold text-[#1B2A4A] tabular-nums px-2">
                  {pagina} / {totalPaginas}
                </span>
                <button
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold btn-superficie"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <ComprobanteModal
        abierto={modalComprobanteAbierto}
        venta={ventaDetalle}
        alCerrar={() => {
          setModalComprobanteAbierto(false)
          if (searchParams.has('venta_id')) {
            searchParams.delete('venta_id')
            setSearchParams(searchParams, { replace: true })
          }
        }}
        alNuevaVenta={() => {
          setModalComprobanteAbierto(false)
          navigate('/ventas/nueva')
        }}
      />

      <AnularVentaModal
        abierto={modalAnularAbierto}
        venta={ventaAAnular}
        alCerrar={() => setModalAnularAbierto(false)}
        alConfirmar={async (id, motivo) => {
          await anularMutation.mutateAsync({ id, motivo })
        }}
      />
    </div>
  )
}
