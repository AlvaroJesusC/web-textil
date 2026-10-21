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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-800 text-white flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Iniciar Conteo Físico</h2>
              <p className="text-xs text-slate-500">Captura de stock del sistema (RF-27)</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            disabled={estaCargando}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
            <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <p>
              Al iniciar, el sistema tomará una <strong>captura inmutable</strong> del stock
              actual de todos los productos. Cualquier venta o movimiento posterior no alterará esta base de comparación.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Observaciones o Turno (Opcional)
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej.: Auditoría de fin de mes, Almacén Central..."
              maxLength={255}
              disabled={estaCargando}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-700 focus:border-transparent transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCerrar}
              disabled={estaCargando}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={estaCargando}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg shadow-xs disabled:opacity-50 transition-colors"
            >
              {estaCargando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Capturando Stock...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
