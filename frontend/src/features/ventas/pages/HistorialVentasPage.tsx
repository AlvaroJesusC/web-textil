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
  Clock,
  Loader2,
} from 'lucide-react'

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

  // Si se navega desde el Dashboard con ?venta_id=X, abrir automáticamente el comprobante
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

  const abrirDetalle = (v: Venta) => {
    setVentaDetalle(v)
    setModalComprobanteAbierto(true)
  }

  const abrirAnular = (v: Venta) => {
    setVentaAAnular(v)
    setModalAnularAbierto(true)
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F9F8F5]">
      <Header
        titulo="Auditoría e Historial de Ventas"
        subtitulo="Consulta de comprobantes emitidos, verificación de IGV 18% y anulaciones contables"
      />

      <main className="p-6 space-y-5">
        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E3DC] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <label className="text-xs font-bold text-[#1B2A4A]">Medio de pago:</label>
            <select
              value={metodoPago || ''}
              onChange={(e) => {
                setMetodoPago((e.target.value as MetodoPago) || undefined)
                setPagina(1)
              }}
              className="px-3 py-2 text-xs font-medium border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none bg-white text-[#1B2A4A] transition-all"
            >
              <option value="">Todos los medios</option>
              <option value="efectivo">Efectivo</option>
              <option value="yape_plin">Yape / Plin</option>
              <option value="tarjeta">Tarjeta Débito/Crédito</option>
              <option value="transferencia">Transferencia Bancaria</option>
            </select>
          </div>

          <div className="text-xs text-slate-600 font-medium">
            Total comprobantes emitidos:{' '}
            <span className="font-bold text-[#1B2A4A] tabular-nums">{total}</span>
          </div>
        </div>

        {/* Tabla de Historial de Ventas */}
        <div className="bg-white rounded-xl border border-[#E6E3DC] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F2F0EA] border-b border-[#E6E3DC] text-[#1B2A4A] font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">N° Comprobante</th>
                  <th className="py-3 px-4 whitespace-nowrap">Fecha y Hora</th>
                  <th className="py-3 px-4 whitespace-nowrap">Vendedor</th>
                  <th className="py-3 px-4 whitespace-nowrap">Cliente</th>
                  <th className="py-3 px-4 whitespace-nowrap">Medio Pago</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Subtotal</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">IGV (18%)</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Total (S/)</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Estado</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E3DC]/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#2452E8]" />
                        <span className="font-semibold text-xs text-[#1B2A4A]">
                          Cargando ventas...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : ventas.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-[#1B2A4A]">Sin comprobantes de venta</p>
                    </td>
                  </tr>
                ) : (
                  ventas.map((v) => {
                    const esAnulada = v.estado === 'anulada'
                    return (
                      <tr
                        key={v.id}
                        className={`hover:bg-[#F9F8F5] transition-colors h-11 ${
                          esAnulada ? 'bg-[#FEE2E2]/30 text-slate-400' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-[#1B2A4A] text-xs">
                          {v.numero}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1.5 text-[11px] tabular-nums">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatearFecha(v.fecha)}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-[#1B2A4A] font-semibold">
                          {v.vendedor_nombre || `Vendedor #${v.vendedor_id}`}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {v.cliente_nombre ? (
                            <div>
                              <p className="font-semibold text-[#1B2A4A]">{v.cliente_nombre}</p>
                              {v.cliente_documento && (
                                <p className="text-[10px] text-slate-500 font-mono">
                                  {v.cliente_documento}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Cliente general</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#F2F0EA] border border-[#E6E3DC] text-[#1B2A4A] text-[11px] font-semibold capitalize whitespace-nowrap">
                            {v.metodo_pago.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-600 font-medium whitespace-nowrap">
                          {formatearMoneda(v.subtotal)}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-600 font-medium whitespace-nowrap">
                          {formatearMoneda(v.igv)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-extrabold text-[#1B2A4A] tabular-nums whitespace-nowrap">
                          {formatearMoneda(v.total)}
                        </td>
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          {esAnulada ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#FEE2E2] text-[#B91C1C] whitespace-nowrap">
                              Anulada
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#DCFCE7] text-[#15803D] whitespace-nowrap">
                              Emitida
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              title="Ver Comprobante"
                              onClick={() => abrirDetalle(v)}
                              className="p-1.5 text-[#2452E8] hover:bg-[#2452E8]/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {/* Botón Anular */}
                            {tieneRol('administrador') && !esAnulada && (
                              <button
                                title="Anular venta y reponer stock"
                                onClick={() => abrirAnular(v)}
                                className="p-1.5 text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer"
                              >
                                <Ban className="w-4 h-4" />
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

          {/* Paginación */}
          {total > porPagina && (
            <div className="p-3.5 bg-[#F2F0EA]/60 border-t border-[#E6E3DC] flex items-center justify-between text-xs text-slate-600">
              <div>
                Mostrando <span className="font-bold text-[#1B2A4A]">{ventas.length}</span> de{' '}
                <span className="font-bold text-[#1B2A4A]">{total}</span> ventas
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                  className="px-3 py-1.5 bg-white border border-[#E6E3DC] rounded-lg text-xs font-semibold text-[#1B2A4A] hover:bg-[#F9F8F5] disabled:opacity-40 transition-colors"
                >
                  Anterior
                </button>
                <span className="font-bold text-[#1B2A4A] tabular-nums">
                  {pagina} / {totalPaginas}
                </span>
                <button
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                  className="px-3 py-1.5 bg-white border border-[#E6E3DC] rounded-lg text-xs font-semibold text-[#1B2A4A] hover:bg-[#F9F8F5] disabled:opacity-40 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Comprobante / Detalle */}
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

      {/* Modal de Anulación */}
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
