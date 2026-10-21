import React, { useState } from 'react'
import type { Venta } from '@/types'
import { X, AlertOctagon, Loader2, AlertCircle } from 'lucide-react'

interface AnularVentaModalProps {
  abierto: boolean
  venta: Venta | null
  alCerrar: () => void
  alConfirmar: (id: number, motivo: string) => Promise<void>
}

export const AnularVentaModal: React.FC<AnularVentaModalProps> = ({
  abierto,
  venta,
  alCerrar,
  alConfirmar,
}) => {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!abierto || !venta) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!motivo.trim() || motivo.trim().length < 3) {
      setError('El motivo de anulación es obligatorio (mínimo 3 caracteres).')
      return
    }

    try {
      setEnviando(true)
      await alConfirmar(venta.id, motivo.trim())
      alCerrar()
    } catch (err: unknown) {
      const apiErr = err as { detalle?: string }
      setError(apiErr.detalle || 'Error al anular la venta.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50">
          <div className="flex items-center gap-2 text-rose-800">
            <AlertOctagon className="w-5 h-5 text-rose-700" />
            <h3 className="font-bold text-sm text-slate-900">Anular Venta #{venta.numero}</h3>
          </div>
          <button onClick={alCerrar} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200 text-xs text-rose-900 leading-relaxed">
            <p className="font-semibold mb-1">¡Advertencia de Transacción ACID!</p>
            Al anular esta venta, los productos se devolverán automáticamente al stock de almacén y quedará registrado en el kardex y la auditoría.
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-100 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Motivo Obligatorio de Anulación *
            </label>
            <textarea
              rows={3}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Cliente canceló el pedido por error en el corte..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-700 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={alCerrar}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {enviando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirmar Anulación</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
