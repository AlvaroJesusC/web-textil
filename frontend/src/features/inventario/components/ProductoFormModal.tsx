import React, { useState } from 'react'
import type { Producto, Categoria, UnidadMedida } from '@/types'
import { X, Loader2, AlertCircle } from 'lucide-react'

interface FormularioDatos {
  sku: string
  nombre: string
  descripcion?: string
  categoria_id: number
  unidad: UnidadMedida
  precio: number
  stock_actual?: number
  stock_minimo: number
}

interface ProductoFormModalProps {
  abierto: boolean
  productoAEditar?: Producto | null
  categorias: Categoria[]
  alCerrar: () => void
  alGuardar: (datos: FormularioDatos) => Promise<void>
}

interface FormContenidoProps {
  productoAEditar?: Producto | null
  categorias: Categoria[]
  alCerrar: () => void
  alGuardar: (datos: FormularioDatos) => Promise<void>
}

const FormContenido: React.FC<FormContenidoProps> = ({
  productoAEditar,
  categorias,
  alCerrar,
  alGuardar,
}) => {
  const esEdicion = !!productoAEditar

  const [sku, setSku] = useState(() => productoAEditar?.sku ?? '')
  const [nombre, setNombre] = useState(() => productoAEditar?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(() => productoAEditar?.descripcion ?? '')
  const [categoriaId, setCategoriaId] = useState<number>(
    () => productoAEditar?.categoria_id ?? (categorias[0]?.id || 1)
  )
  const [unidad, setUnidad] = useState<UnidadMedida>(() => productoAEditar?.unidad ?? 'metro')
  const [precio, setPrecio] = useState(() => (productoAEditar ? String(productoAEditar.precio) : ''))
  const [stockActual, setStockActual] = useState('0')
  const [stockMinimo, setStockMinimo] = useState(() =>
    productoAEditar ? String(productoAEditar.stock_minimo) : '5'
  )
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!sku.trim() || !nombre.trim() || !precio) {
      setError('Por favor complete el SKU, nombre y precio.')
      return
    }

    const precioNum = parseFloat(precio)
    if (isNaN(precioNum) || precioNum <= 0) {
      setError('El precio debe ser un número mayor a 0.')
      return
    }

    const stockMinNum = parseInt(stockMinimo, 10)
    if (isNaN(stockMinNum) || stockMinNum < 0) {
      setError('El stock mínimo debe ser 0 o mayor.')
      return
    }

    try {
      setEnviando(true)
      await alGuardar({
        sku: sku.trim().toUpperCase(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        categoria_id: Number(categoriaId) || (categorias[0]?.id || 1),
        unidad,
        precio: precioNum,
        stock_actual: esEdicion ? undefined : parseInt(stockActual, 10) || 0,
        stock_minimo: stockMinNum,
      })
      alCerrar()
    } catch (err: unknown) {
      const apiErr = err as { detalle?: string }
      setError(apiErr.detalle || 'Error al guardar el producto.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
      {/* Cabecera */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div>
          <h3 className="font-bold text-slate-900 text-base">
            {esEdicion ? 'Editar Producto Textil' : 'Registrar Nuevo Producto'}
          </h3>
          <p className="text-xs text-slate-500">
            {esEdicion
              ? `Modificando SKU: ${productoAEditar.sku}`
              : 'Ingreso de nuevo material o prenda al catálogo'}
          </p>
        </div>
        <button
          onClick={alCerrar}
          className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Código SKU *
            </label>
            <input
              type="text"
              required
              disabled={esEdicion}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Ej: TEL-005"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none uppercase font-mono disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Categoría *
            </label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-white"
            >
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Nombre del Producto *
          </label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Tela Denim Pesada 14oz"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Unidad *
            </label>
            <select
              value={unidad}
              onChange={(e) => setUnidad(e.target.value as UnidadMedida)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-white"
            >
              <option value="metro">Metro</option>
              <option value="cono">Cono</option>
              <option value="unidad">Unidad</option>
              <option value="bolsa">Bolsa</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Precio Unitario (S/) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Stock Mínimo *
            </label>
            <input
              type="number"
              min="0"
              required
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none tabular-nums"
            />
          </div>
        </div>

        {!esEdicion && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Stock Inicial en Almacén
            </label>
            <input
              type="number"
              min="0"
              value={stockActual}
              onChange={(e) => setStockActual(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none tabular-nums"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Cantidad disponible inmediatamente al momento de creación.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Descripción o Detalles Técnicos
          </label>
          <textarea
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Composición de hilado, gramaje, color o proveedor..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none"
          />
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={alCerrar}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-xs flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {enviando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{esEdicion ? 'Actualizar Producto' : 'Guardar Producto'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export const ProductoFormModal: React.FC<ProductoFormModalProps> = ({
  abierto,
  productoAEditar,
  categorias,
  alCerrar,
  alGuardar,
}) => {
  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <FormContenido
        key={productoAEditar?.id ?? 'nuevo'}
        productoAEditar={productoAEditar}
        categorias={categorias}
        alCerrar={alCerrar}
        alGuardar={alGuardar}
      />
    </div>
  )
}
