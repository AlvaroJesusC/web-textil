import React, { useState } from 'react'
import type { Producto } from '@/types'
import { X, ArrowDownCircle, Loader2, AlertCircle } from 'lucide-react'

interface IngresoStockModalProps {
  abierto: boolean
  producto: Producto | null
  alCerrar: () => void
  alGuardar: (id: number, datos: {
    cantidad: number
    proveedor?: string
    documento?: string
    motivo?: string
  }) => Promise<void>
}

export const IngresoStockModal: React.FC<IngresoStockModalProps> = ({
  abierto,
  producto,
  alCerrar,
  alGuardar,
}) => {
  const [cantidad, setCantidad] = useState('')
  const [proveedor, setProveedor] = useState('')
  const [documento, setDocumento] = useState('')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!abierto || !producto) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cantNum = parseInt(cantidad, 10)
    if (isNaN(cantNum) || cantNum <= 0) {
      setError('La cantidad a ingresar debe ser un número entero mayor a 0.')
      return
    }

    try {
      setEnviando(true)
      await alGuardar(producto.id, {
        cantidad: cantNum,
        proveedor: proveedor.trim() || undefined,
        documento: documento.trim() || undefined,
        motivo: motivo.trim() || undefined,
      })
      alCerrar()
    } catch (err: unknown) {
      const apiErr = err as { detalle?: string }
      setError(apiErr.detalle || 'Error al registrar el ingreso.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-emerald-800">
            <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Registrar Ingreso de Mercadería</h3>
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
              Stock actual: <span className="font-bold text-slate-900">{producto.stock_actual} {producto.unidad}(s)</span>
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
              Cantidad a ingresar ({producto.unidad}) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ej: 50"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none tabular-nums"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Proveedor
              </label>
              <input
                type="text"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Ej: Hilados Perú S.A."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Guía / Factura
              </label>
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="GR-001-289"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observaciones
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Compra de lote de temporada"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
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
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {enviando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Registrar Ingreso</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
