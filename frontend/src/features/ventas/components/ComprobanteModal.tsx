import React from 'react'
import type { Venta } from '@/types'
import { useAuth } from '@/features/auth'
import { formatearMoneda, formatearFecha } from '@/lib/formato'
import { CheckCircle2, Ban, Printer, Plus, Scissors, X } from 'lucide-react'

interface ComprobanteModalProps {
  abierto: boolean
  venta: Venta | null
  alCerrar: () => void
  alNuevaVenta: () => void
}

export const ComprobanteModal: React.FC<ComprobanteModalProps> = ({
  abierto,
  venta,
  alCerrar,
  alNuevaVenta,
}) => {
  const { tieneRol } = useAuth()

  if (!abierto || !venta) return null

  const esAnulada = venta.estado === 'anulada'
  const puedeRegistrarVenta = tieneRol('administrador', 'vendedor')

  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2A4A]/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E6E3DC] w-full max-w-md overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-[#E6E3DC] bg-[#F2F0EA]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 ${
                esAnulada ? 'bg-[#DC2626]' : 'bg-[#15803D]'
              }`}
            >
              {esAnulada ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-extrabold text-[#1B2A4A] text-sm">
                {esAnulada ? 'Comprobante Anulado' : 'Comprobante Emitido'}
              </h3>
              <p
                className={`text-[11px] font-mono font-bold ${
                  esAnulada ? 'text-[#DC2626]' : 'text-[#2452E8]'
                }`}
              >
                N° {venta.numero}
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

        {/* Ticket de venta */}
        <div id="ticket-imprimible" className="p-6 space-y-4 bg-white text-xs text-[#1B2A4A]">
          {esAnulada && (
            <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#DC2626]/20 text-[#B91C1C] text-xs">
              <p className="font-extrabold uppercase tracking-wider text-[10px]">
                Operación Anulada · Stock Reintegrado
              </p>
              {venta.motivo_anulacion && (
                <p className="mt-0.5 font-medium">Motivo: {venta.motivo_anulacion}</p>
              )}
            </div>
          )}
          <div className="text-center pb-3.5 border-b border-dashed border-[#E6E3DC]">
            <div className="flex items-center justify-center gap-2 font-extrabold text-[#1B2A4A] text-sm tracking-tight">
              <Scissors className="w-4 h-4 text-[#D95D39] -rotate-45" />
              <span>TEXTILERÍA LIMA S.A.C.</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              RUC: <span className="font-mono">20608976543</span> · Jr. Gamarra 1050, La Victoria
            </p>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
              Comprobante de Control Interno
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] py-1.5 border-b border-[#E6E3DC]">
            <div>
              <span className="text-slate-500">Fecha:</span>{' '}
              <span className="font-semibold tabular-nums">{formatearFecha(venta.fecha)}</span>
            </div>
            <div>
              <span className="text-slate-500">Vendedor:</span>{' '}
              <span className="font-semibold">{venta.vendedor_nombre || 'Mostrador'}</span>
            </div>
            <div>
              <span className="text-slate-500">Cliente:</span>{' '}
              <span className="font-semibold">{venta.cliente_nombre || 'General'}</span>
            </div>
            <div>
              <span className="text-slate-500">Medio:</span>{' '}
              <span className="font-bold uppercase text-[#1B2A4A]">
                {venta.metodo_pago.replace('_', ' / ')}
              </span>
            </div>
          </div>

          {/* Tabla de ítems del ticket */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E6E3DC] text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-1.5">Cant.</th>
                <th className="py-1.5">Artículo</th>
                <th className="py-1.5 text-right">P. Unit</th>
                <th className="py-1.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E3DC]/60">
              {venta.detalles.map((d) => (
                <tr key={d.id}>
                  <td className="py-2 font-bold tabular-nums">{d.cantidad}</td>
                  <td className="py-2 font-semibold text-[#1B2A4A]">
                    {d.producto_nombre || d.producto_sku}
                  </td>
                  <td className="py-2 text-right tabular-nums text-slate-600">
                    {formatearMoneda(d.precio_unitario)}
                  </td>
                  <td className="py-2 text-right font-bold tabular-nums text-[#1B2A4A]">
                    {formatearMoneda(d.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales contables desglosados */}
          <div className="pt-2.5 border-t border-[#E6E3DC] space-y-1 text-right text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Subtotal bruto:</span>
              <span className="tabular-nums font-semibold">{formatearMoneda(venta.subtotal)}</span>
            </div>
            {parseFloat(venta.descuento || '0') > 0 && (
              <div className="flex justify-between text-[#15803D] font-semibold">
                <span>Descuento ({venta.descuento_pct}%):</span>
                <span className="tabular-nums">- {formatearMoneda(venta.descuento)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 font-medium">
              <span>IGV (18%):</span>
              <span className="tabular-nums font-semibold">{formatearMoneda(venta.igv)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-[#1B2A4A] pt-2 border-t border-[#E6E3DC]">
              <span>TOTAL EMITIDO:</span>
              <span className="text-base tabular-nums">{formatearMoneda(venta.total)}</span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="p-4 bg-[#F2F0EA]/60 border-t border-[#E6E3DC] flex items-center justify-between gap-2">
          <button
            onClick={handleImprimir}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1B2A4A] hover:bg-[#F9F8F5] bg-white border border-[#E6E3DC] rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#2452E8]" />
            <span>Imprimir Ticket</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={alCerrar}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-white rounded-lg transition-all cursor-pointer"
            >
              Cerrar
            </button>
            {puedeRegistrarVenta && (
              <button
                onClick={alNuevaVenta}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#D95D39] hover:bg-[#C24D2B] rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Nueva Venta</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
