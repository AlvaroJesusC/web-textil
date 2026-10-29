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
        return <ArrowDownLeft className="w-3.5 h-3.5 text-[#15803D]" />
      case 'salida_venta':
      case 'venta':
        return <ArrowUpRight className="w-3.5 h-3.5 text-[#2452E8]" />
      default:
        return <SlidersHorizontal className="w-3.5 h-3.5 text-[#D97706]" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2A4A]/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E6E3DC] w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-[#E6E3DC] flex items-center justify-between bg-[#F2F0EA]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#1B2A4A] text-sm">Kardex de Movimientos Textil</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                <span className="font-mono font-semibold text-[#1B2A4A]">{producto.sku}</span> ·{' '}
                {producto.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={alCerrar}
            className="text-slate-400 hover:text-[#1B2A4A] rounded-lg p-1.5 hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-[#2452E8]" />
              <span className="font-semibold text-[#1B2A4A]">Cargando kardex de movimientos...</span>
            </div>
          ) : !movimientos || movimientos.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              No hay movimientos de inventario registrados para este artículo.
            </div>
          ) : (
            <div className="border border-[#E6E3DC] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F2F0EA] border-b border-[#E6E3DC] text-[#1B2A4A] font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3.5">Fecha</th>
                    <th className="py-2.5 px-3.5">Tipo</th>
                    <th className="py-2.5 px-3.5 text-right">Cantidad</th>
                    <th className="py-2.5 px-3.5 text-right">Anterior</th>
                    <th className="py-2.5 px-3.5 text-right">Saldo</th>
                    <th className="py-2.5 px-3.5">Detalle / Documento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E3DC]/60">
                  {movimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-[#F9F8F5] transition-colors">
                      <td className="py-2.5 px-3.5 text-slate-600 text-[11px] tabular-nums">
                        {formatearFecha(m.fecha)}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="inline-flex items-center gap-1.5 font-semibold capitalize text-[#1B2A4A]">
                          {renderIconoTipo(m.tipo)}
                          {m.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[#1B2A4A] tabular-nums">
                        {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-slate-500 tabular-nums">
                        {m.stock_anterior}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-[#2452E8] tabular-nums">
                        {m.stock_resultante}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 truncate max-w-xs text-[11px]">
                        {m.motivo || m.documento || m.proveedor || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-[#E6E3DC] bg-[#F2F0EA]/60 flex justify-end shrink-0">
          <button
            onClick={alCerrar}
            className="px-4 py-2 text-xs font-semibold text-[#1B2A4A] bg-white border border-[#E6E3DC] hover:bg-[#F9F8F5] rounded-lg transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
