import React, { useState } from 'react'
import { X, Play, Loader2, ClipboardList, Info } from 'lucide-react'

interface IniciarConteoModalProps {
  abierto: boolean
  onCerrar: () => void
  onConfirmar: (observaciones?: string) => Promise<void>
  estaCargando: boolean
}

export const IniciarConteoModal: React.FC<IniciarConteoModalProps> = ({
  abierto,
  onCerrar,
  onConfirmar,
  estaCargando,
}) => {
  const [observaciones, setObservaciones] = useState('')

  if (!abierto) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onConfirmar(observaciones.trim() || undefined)
    setObservaciones('')
    onCerrar()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2A4A]/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E6E3DC] w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E3DC] bg-[#F2F0EA]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#1B2A4A]">Iniciar Conteo Físico</h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Captura inmutable de existencias del sistema
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
          <div className="p-3.5 rounded-xl bg-[#2452E8]/8 border border-[#2452E8]/20 flex items-start gap-2.5 text-xs text-[#1B2A4A] leading-relaxed">
            <Info className="w-4 h-4 text-[#2452E8] shrink-0 mt-0.5" />
            <p>
              El sistema generará una <strong>captura inmutable</strong> del stock actual en almacén.
              Los movimientos de venta posteriores no afectarán esta base de comparación de auditoría.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] uppercase tracking-wider mb-1.5">
              Observaciones / Turno (Opcional)
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej.: Cierre mensual de almacén central..."
              maxLength={255}
              disabled={estaCargando}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E6E3DC] focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none text-[#1B2A4A] transition-all"
            />
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
                  <span>Capturando Stock...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
