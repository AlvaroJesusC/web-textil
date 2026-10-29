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

  const limpiarYCerrar = () => {
    setMotivo('')
    setError(null)
    alCerrar()
  }

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
      limpiarYCerrar()
    } catch (err: unknown) {
      const apiErr = err as { detalle?: string }
      setError(apiErr.detalle || 'Error al anular la venta.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2A4A]/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E6E3DC] w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E6E3DC] flex items-center justify-between bg-[#F2F0EA]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#DC2626] text-white flex items-center justify-center shrink-0">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#1B2A4A]">
                Anular Venta
              </h3>
              <p className="text-[11px] font-mono font-bold text-[#DC2626]">N° {venta.numero}</p>
            </div>
          </div>
          <button
            onClick={limpiarYCerrar}
            className="text-slate-400 hover:text-[#1B2A4A] rounded-lg p-1.5 hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-[#FEE2E2]/60 rounded-xl border border-[#DC2626]/20 text-xs text-[#B91C1C] leading-relaxed">
            <p className="font-bold mb-0.5">Control de Auditoría y Transacción</p>
            Al confirmar la anulación, los metros y conos vendidos se reintegrarán de inmediato al stock del almacén y la operación quedará registrada en el Kardex.
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#FEE2E2] text-[#B91C1C] text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
              Motivo Obligatorio de Anulación *
            </label>
            <textarea
              rows={3}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Cliente canceló el pedido por defecto en corte..."
              className="w-full px-3 py-2 text-xs border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none text-[#1B2A4A] transition-all"
            />
          </div>

          <div className="pt-3 border-t border-[#E6E3DC] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={limpiarYCerrar}
              className="px-4 py-2 text-xs font-semibold text-[#1B2A4A] bg-white border border-[#E6E3DC] hover:bg-[#F9F8F5] rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-5 py-2 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
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
