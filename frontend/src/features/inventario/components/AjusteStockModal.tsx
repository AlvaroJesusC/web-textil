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

  const limpiarYCerrar = () => {
    setNuevoStock('')
    setMotivo('')
    setError(null)
    alCerrar()
  }

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
      limpiarYCerrar()
    } catch (err: unknown) {
      const apiErr = err as { detalle?: string }
      setError(apiErr.detalle || 'Error al registrar el ajuste de stock.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2A4A]/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E6E3DC] w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E6E3DC] flex items-center justify-between bg-[#F2F0EA]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#1B2A4A] text-sm">
                Ajuste Manual de Stock (Kardex)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Regularización de existencias</p>
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
          <div className="bg-[#F9F8F5] p-3.5 rounded-xl border border-[#E6E3DC]">
            <p className="text-xs text-[#2452E8] font-mono font-bold">{producto.sku}</p>
            <p className="text-sm font-extrabold text-[#1B2A4A] mt-0.5">{producto.nombre}</p>
            <p className="text-xs text-slate-600 mt-1">
              Stock actual en sistema:{' '}
              <span className="font-bold text-[#1B2A4A] tabular-nums">
                {producto.stock_actual}
              </span>{' '}
              {producto.unidad}(s)
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#DC2626]/20 flex items-start gap-2 text-[#B91C1C] text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] uppercase tracking-wider mb-1.5">
              Nuevo Stock Físico ({producto.unidad}) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={nuevoStock}
              onChange={(e) => setNuevoStock(e.target.value)}
              placeholder="Ej: 45"
              className="w-full px-3 py-2 text-xs border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none font-bold tabular-nums text-[#1B2A4A] transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Este valor sustituirá inmediatamente el balance en almacén.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] uppercase tracking-wider mb-1.5">
              Motivo Obligatorio del Ajuste *
            </label>
            <textarea
              rows={2}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Merma por corte de retazos / Conteo físico periódico..."
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
              className="px-5 py-2 text-xs font-bold text-white bg-[#D95D39] hover:bg-[#C24D2B] rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
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
