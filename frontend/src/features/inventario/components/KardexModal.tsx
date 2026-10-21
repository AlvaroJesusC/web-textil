import React from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Producto } from '@/types'
import { obtenerKardexApi } from '../api'
import { formatearFecha } from '@/lib/formato'
import { X, History, Loader2, ArrowUpRight, ArrowDownLeft, SlidersHorizontal } from 'lucide-react'

interface KardexModalProps {
  abierto: boolean
  producto: Producto | null
  alCerrar: () => void
}

export const KardexModal: React.FC<KardexModalProps> = ({ abierto, producto, alCerrar }) => {
  const { data: movimientos, isLoading } = useQuery({
    queryKey: ['kardex', producto?.id],
    queryFn: () => (producto ? obtenerKardexApi(producto.id) : Promise.resolve([])),
    enabled: abierto && !!producto,
  })

  if (!abierto || !producto) return null

  const renderIconoTipo = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'ingreso':
        return <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
      case 'salida_venta':
      case 'venta':
        return <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
      default:
        return <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Kardex de Movimientos (RF-14)</h3>
              <p className="text-xs text-slate-500 font-mono">
                {producto.sku} · {producto.nombre}
              </p>
            </div>
          </div>
          <button onClick={alCerrar} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-6 h-6 animate-spin text-blue-800" />
              <span>Cargando movimientos...</span>
            </div>
          ) : !movimientos || movimientos.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No hay movimientos registrados para este producto.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3 text-right">Cantidad</th>
                    <th className="py-2.5 px-3 text-right">Anterior</th>
                    <th className="py-2.5 px-3 text-right">Saldo</th>
                    <th className="py-2.5 px-3">Detalle / Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-slate-600">{formatearFecha(m.fecha)}</td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center gap-1 font-medium capitalize text-slate-700">
                          {renderIconoTipo(m.tipo)}
                          {m.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">
                        {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500 tabular-nums">{m.stock_anterior}</td>
                      <td className="py-2 px-3 text-right font-bold text-blue-900 tabular-nums">
                        {m.stock_resultante}
                      </td>
                      <td className="py-2 px-3 text-slate-600 truncate max-w-xs">
                        {m.motivo || m.documento || m.proveedor || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={alCerrar}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
