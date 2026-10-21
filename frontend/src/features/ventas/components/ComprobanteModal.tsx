import React from 'react'
import type { Venta } from '@/types'
import { formatearMoneda, formatearFecha } from '@/lib/formato'
import { CheckCircle2, Printer, PlusCircle, Scissors } from 'lucide-react'

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
  if (!abierto || !venta) return null

  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Cabecera Éxito */}
        <div className="bg-emerald-700 text-white p-6 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-bold">¡Venta Registrada Exitosamente!</h3>
          <p className="text-xs text-emerald-100 mt-1 font-mono">
            Comprobante N° {venta.numero} · Stock descontado en almacén
          </p>
        </div>

        {/* Ticket de venta imprimible */}
        <div id="ticket-imprimible" className="p-6 space-y-4 bg-white text-xs text-slate-800">
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <div className="flex items-center justify-center gap-1.5 font-bold text-slate-900 text-sm">
              <Scissors className="w-4 h-4 text-blue-900 -rotate-45" />
              <span>TEXTILERÍA LIMA</span>
            </div>
            <p className="text-[11px] text-slate-500">RUC: 20608976543 · Jr. Gamarra 1050, La Victoria, Lima</p>
            <p className="text-[11px] text-slate-500">Comprobante Interno de Venta</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-b border-slate-200">
            <div>
              <span className="text-slate-500">Fecha:</span> {formatearFecha(venta.fecha)}
            </div>
            <div>
              <span className="text-slate-500">Vendedor:</span> {venta.vendedor_nombre || 'Mostrador'}
            </div>
            <div>
              <span className="text-slate-500">Cliente:</span> {venta.cliente_nombre || 'Cliente General'}
            </div>
            <div>
              <span className="text-slate-500">Pago:</span>{' '}
              <span className="font-semibold uppercase">{venta.metodo_pago.replace('_', ' / ')}</span>
            </div>
          </div>

          {/* Tabla de ítems del ticket */}
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <th className="py-1">Cant.</th>
                <th className="py-1">Producto</th>
                <th className="py-1 text-right">P. Unit</th>
                <th className="py-1 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {venta.detalles.map((d) => (
                <tr key={d.id}>
                  <td className="py-1.5 font-bold tabular-nums">{d.cantidad}</td>
                  <td className="py-1.5 font-medium">{d.producto_nombre || d.producto_sku}</td>
                  <td className="py-1.5 text-right tabular-nums">{formatearMoneda(d.precio_unitario)}</td>
                  <td className="py-1.5 text-right font-bold tabular-nums">{formatearMoneda(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales desglosados */}
          <div className="pt-2 border-t border-slate-200 space-y-1 text-right text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="tabular-nums">{formatearMoneda(venta.subtotal)}</span>
            </div>
            {parseFloat(venta.descuento || '0') > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Descuento ({venta.descuento_pct}%):</span>
                <span className="tabular-nums">- {formatearMoneda(venta.descuento)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>IGV (18%):</span>
              <span className="tabular-nums">{formatearMoneda(venta.igv)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL PAGADO:</span>
              <span className="tabular-nums text-blue-900">{formatearMoneda(venta.total)}</span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handleImprimir}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-white border border-slate-300 rounded-lg shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir Comprobante</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={alCerrar}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={alNuevaVenta}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nueva Venta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
