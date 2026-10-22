import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/features/auth'
import { listarVentasApi, anularVentaApi } from '../api'
import type { Venta, MetodoPago } from '@/types'
import { formatearMoneda, formatearFecha } from '@/lib/formato'
import { ComprobanteModal } from '../components/ComprobanteModal'
import { AnularVentaModal } from '../components/AnularVentaModal'
import {
  Receipt,
  FileText,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react'

export const HistorialVentasPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { tieneRol } = useAuth()

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

  const anularMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => anularVentaApi(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-pos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-dashboard'] })
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
    <div className="flex-1 flex flex-col">
      <Header
        titulo="Historial de Ventas"
        subtitulo="Consulta de comprobantes emitidos, desglose de IGV y anulación transaccional"
      />

      <main className="p-6 space-y-4">
        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-700">Filtrar por Método de Pago:</label>
            <select
              value={metodoPago || ''}
              onChange={(e) => {
                setMetodoPago((e.target.value as MetodoPago) || undefined)
                setPagina(1)
              }}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-white text-slate-700 font-medium"
            >
              <option value="">Todos los métodos</option>
              <option value="efectivo">Efectivo</option>
              <option value="yape_plin">Yape / Plin</option>
              <option value="tarjeta">Tarjeta Débito/Crédito</option>
              <option value="transferencia">Transferencia Bancaria</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Total de ventas: <span className="font-bold text-slate-900">{total}</span>
          </div>
        </div>

        {/* Tabla de Historial de Ventas */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">N° Comprobante</th>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Método Pago</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">IGV (18%)</th>
                  <th className="py-3 px-4 text-right">Total (S/)</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-900" />
                        <span>Cargando ventas...</span>
                      </div>
                    </td>
                  </tr>
                ) : ventas.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium">No se encontraron ventas registradas.</p>
                    </td>
                  </tr>
                ) : (
                  ventas.map((v) => {
                    const esAnulada = v.estado === 'anulada'
                    return (
                      <tr
                        key={v.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          esAnulada ? 'bg-rose-50/20 text-slate-500' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{v.numero}</td>
                        <td className="py-3 px-4 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatearFecha(v.fecha)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {v.vendedor_nombre || `Vendedor #${v.vendedor_id}`}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {v.cliente_nombre ? (
                            <div>
                              <p className="font-medium text-slate-900">{v.cliente_nombre}</p>
                              {v.cliente_documento && (
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {v.cliente_documento}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Cliente general</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] capitalize">
                            {v.metodo_pago.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                          {formatearMoneda(v.subtotal)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                          {formatearMoneda(v.igv)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums text-sm">
                          {formatearMoneda(v.total)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {esAnulada ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Anulada</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Completada</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              title="Ver Comprobante / Detalle"
                              onClick={() => abrirDetalle(v)}
                              className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {/* Botón Anular (Solo Administrador y si no está anulada) */}
                            {tieneRol('administrador') && !esAnulada && (
                              <button
                                title="Anular venta y reponer stock"
                                onClick={() => abrirAnular(v)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
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
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Mostrando {ventas.length} de {total} ventas
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="font-semibold text-slate-800">
                  {pagina} / {totalPaginas}
                </span>
                <button
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
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
        alCerrar={() => setModalComprobanteAbierto(false)}
        alNuevaVenta={() => {
          setModalComprobanteAbierto(false)
          window.location.href = '/ventas/nueva'
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
