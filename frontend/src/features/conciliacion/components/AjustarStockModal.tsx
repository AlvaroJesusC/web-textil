import React, { useState } from 'react'
import { X, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react'

interface AjustarStockModalProps {
  abierto: boolean
  onCerrar: () => void
  onConfirmar: (motivo: string) => Promise<void>
  estaCargando: boolean
  cantidadProductos: number
}

export const AjustarStockModal: React.FC<AjustarStockModalProps> = ({
  abierto,
  onCerrar,
  onConfirmar,
  estaCargando,
  cantidadProductos,
}) => {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!abierto) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!motivo.trim() || motivo.trim().length < 3) {
      setError('El motivo es obligatorio y debe tener al menos 3 caracteres.')
      return
    }
    setError(null)
    await onConfirmar(motivo.trim())
    setMotivo('')
    onCerrar()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2A4A]/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E6E3DC] w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E3DC] bg-[#F2F0EA]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#1B2A4A]">
                Ajustar Inventario al Conteo Físico
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Autorización requerida (Administrador)
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            disabled={estaCargando}
            className="text-slate-400 hover:text-[#1B2A4A] rounded-lg p-1.5 hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-[#FEF3C7]/70 border border-[#D97706]/30 flex items-start gap-2.5 text-xs text-[#B45309] leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
            <p>
              Se actualizarán los balances de <strong>{cantidadProductos} artículo(s)</strong> con
              desviación comprobada. Cada sincronización generará un movimiento de ajuste en el Kardex.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] uppercase tracking-wider mb-1.5">
              Motivo del Ajuste Contable <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              rows={3}
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Ej.: Regularización por merma de retazos y deshilado en almacén central..."
              disabled={estaCargando}
              className={`w-full px-3 py-2 text-xs rounded-lg border text-[#1B2A4A] focus:outline-none transition-all ${
                error
                  ? 'border-[#DC2626] ring-2 ring-[#DC2626]/20'
                  : 'border-[#E6E3DC] focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20'
              }`}
            />
            {error && <p className="mt-1 text-xs text-[#DC2626] font-semibold">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E6E3DC]">
            <button
              type="button"
              onClick={onCerrar}
              disabled={estaCargando}
              className="px-4 py-2 text-xs font-semibold text-[#1B2A4A] bg-white border border-[#E6E3DC] hover:bg-[#F9F8F5] rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={estaCargando}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#D95D39] hover:bg-[#C24D2B] rounded-lg shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {estaCargando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sincronizando Stock...</span>
                </>
              ) : (
                <span>Aplicar Ajuste</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
