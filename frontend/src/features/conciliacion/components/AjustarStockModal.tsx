import React, { useState } from 'react'
import { X, Check, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ajustar Stock al Conteo Físico</h2>
              <p className="text-xs text-amber-700 font-medium">Acción exclusiva de Administrador</p>
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
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Se actualizará el stock actual de <strong>{cantidadProductos} producto(s)</strong> en
              el inventario al valor verificado en físico. Cada ajuste quedará asentado en el
              Kardex y en la bitácora de auditoría.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Motivo del Ajuste <span className="text-rose-500">*</span>
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
              className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-hidden transition ${
                error
                  ? 'border-rose-400 ring-2 ring-rose-200 focus:border-rose-500'
                  : 'border-slate-300 focus:ring-2 focus:ring-blue-700 focus:border-transparent'
              }`}
            />
            {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
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
              disabled={estaCargando || cantidadProductos === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs disabled:opacity-50 transition-colors"
            >
              {estaCargando ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Aplicando Ajustes...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Confirmar y Ajustar Stock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
