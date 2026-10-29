import React, { useState } from 'react'
import type { Producto, Categoria, UnidadMedida } from '@/types'
import { X, Loader2, AlertCircle, Package } from 'lucide-react'

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
    <div className="bg-white rounded-2xl shadow-xl border border-[#E6E3DC] w-full max-w-lg overflow-hidden">
      {/* Cabecera */}
      <div className="px-6 py-4 border-b border-[#E6E3DC] flex items-center justify-between bg-[#F2F0EA]/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#1B2A4A] text-sm">
              {esEdicion ? 'Editar Producto Textil' : 'Nuevo Producto en Catálogo'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {esEdicion
                ? `Actualizando especificaciones de SKU: ${productoAEditar.sku}`
                : 'Ficha de ingreso de material o artículo textil'}
            </p>
          </div>
        </div>
        <button
          onClick={alCerrar}
          className="text-slate-400 hover:text-[#1B2A4A] rounded-lg p-1.5 hover:bg-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#DC2626]/20 flex items-start gap-2 text-[#B91C1C] text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626] mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
              Código SKU *
            </label>
            <input
              type="text"
              required
              disabled={esEdicion}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Ej: TEL-005"
              className="w-full px-3 py-2 text-xs border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none uppercase font-mono font-semibold text-[#1B2A4A] disabled:bg-[#F2F0EA] disabled:text-slate-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
              Familia / Categoría *
            </label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-medium border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none bg-white text-[#1B2A4A] transition-all"
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
          <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
            Nombre del Producto *
          </label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Tela Denim Pesada 14oz"
            className="w-full px-3 py-2 text-xs border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none text-[#1B2A4A] font-medium transition-all"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
              Unidad *
            </label>
            <select
              value={unidad}
              onChange={(e) => setUnidad(e.target.value as UnidadMedida)}
              className="w-full px-3 py-2 text-xs font-medium border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none bg-white text-[#1B2A4A] capitalize transition-all"
            >
              <option value="metro">Metro</option>
              <option value="cono">Cono</option>
              <option value="unidad">Unidad</option>
              <option value="bolsa">Bolsa</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
              Precio Unit. (S/) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none font-bold tabular-nums text-[#1B2A4A] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
              Stock Mínimo *
            </label>
            <input
              type="number"
              min="0"
              required
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none font-bold tabular-nums text-[#1B2A4A] transition-all"
            />
          </div>
        </div>

        {!esEdicion && (
          <div>
            <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
              Stock Inicial en Almacén
            </label>
            <input
              type="number"
              min="0"
              value={stockActual}
              onChange={(e) => setStockActual(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none font-bold tabular-nums text-[#1B2A4A] transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Cantidad física disponible inmediatamente para ventas y almacén.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[#1B2A4A] mb-1.5">
            Descripción / Especificaciones
          </label>
          <textarea
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Composición de hilado, gramaje, color o proveedor..."
            className="w-full px-3 py-2 text-xs border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none text-[#1B2A4A] transition-all"
          />
        </div>

        <div className="pt-3 border-t border-[#E6E3DC] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={alCerrar}
            className="px-4 py-2 text-xs font-bold rounded-xl btn-superficie"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="px-5 py-2 text-xs font-bold rounded-xl btn-terracota flex items-center gap-1.5"
          >
            {enviando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{esEdicion ? 'Actualizar Producto' : 'Guardar en Catálogo'}</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2A4A]/50 backdrop-blur-xs p-4 overflow-y-auto">
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
