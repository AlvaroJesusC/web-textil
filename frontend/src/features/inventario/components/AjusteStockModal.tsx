import React, { useState } from 'react'
import type { Producto } from '@/types'
import { X, Sliders, Loader2, AlertCircle } from 'lucide-react'

interface AjusteStockModalProps {
  abierto: boolean
  producto: Producto | null
  alCerrar: () => void
  alGuardar: (id: number, datos: {
    nuevo_stock: number
    motivo: string
  }) => Promise<void>
}

export const AjusteStockModal: React.FC<AjusteStockModalProps> = ({
  abierto,
  producto,
  alCerrar,
  alGuardar,
}) => {
  const [nuevoStock, setNuevoStock] = useState('')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!abierto || !producto) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const stockNum = parseInt(nuevoStock, 10)
    if (isNaN(stockNum) || stockNum < 0) {
      setError('El nuevo stock debe ser un número entero mayor o igual a 0.')
      return
    }

    if (!motivo.trim() || motivo.trim().length < 3) {
      setError('El motivo del ajuste es obligatorio (mínimo 3 caracteres).')
      return
    }

    try {
      setEnviando(true)
      await alGuardar(producto.id, {
        nuevo_stock: stockNum,
        motivo: motivo.trim(),
      })
      alCerrar()
    } catch (err: unknown) {
      const apiErr = err as { detalle?: string }
      setError(apiErr.detalle || 'Error al registrar el ajuste de stock.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-amber-800">
            <Sliders className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-slate-900 text-sm">Ajuste Manual de Inventario (Kardex)</h3>
          </div>
          <button onClick={alCerrar} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-mono">{producto.sku}</p>
            <p className="text-sm font-bold text-slate-900">{producto.nombre}</p>
            <p className="text-xs text-slate-600 mt-1">
              Stock actual registrado:{' '}
              <span className="font-bold text-slate-900">
                {producto.stock_actual} {producto.unidad}(s)
              </span>
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nuevo Stock Físico ({producto.unidad}) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={nuevoStock}
              onChange={(e) => setNuevoStock(e.target.value)}
              placeholder="Ej: 45"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:outline-none tabular-nums"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Este valor reemplazará el stock actual del producto.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Motivo Obligatorio del Ajuste *
            </label>
            <textarea
              rows={2}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Merma por corte de retazos / Conteo físico periódico..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:outline-none"
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
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {enviando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Aplicar Ajuste</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
