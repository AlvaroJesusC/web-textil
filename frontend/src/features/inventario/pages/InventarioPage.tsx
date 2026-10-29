import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/features/auth'
import {
  listarProductosApi,
  listarCategoriasApi,
  crearProductoApi,
  actualizarProductoApi,
  registrarIngresoStockApi,
  registrarAjusteStockApi,
} from '../api'
import type { Producto, EstadoStock, UnidadMedida } from '@/types'
import { formatearMoneda } from '@/lib/formato'
import { ProductoFormModal } from '../components/ProductoFormModal'
import { IngresoStockModal } from '../components/IngresoStockModal'
import { AjusteStockModal } from '../components/AjusteStockModal'
import { KardexModal } from '../components/KardexModal'
import {
  Search,
  Plus,
  ArrowDownCircle,
  Sliders,
  History,
  Edit2,
  Loader2,
  Package,
  X,
} from 'lucide-react'

const PRESENTACION_TEXTIL: Record<string, string> = {
  metro: 'Metro lineal (Rollo)',
  cono: 'Cono de hilado',
  bolsa: 'Bolsa / Paquete',
  unidad: 'Unidad individual',
}

export const InventarioPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { tieneRol } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [busqueda, setBusqueda] = useState(() => searchParams.get('q') || '')
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)
  const [estadoStock, setEstadoStock] = useState<EstadoStock | undefined>(() => {
    const est = searchParams.get('estado_stock')
    return est === 'normal' || est === 'bajo' || est === 'agotado' ? est : undefined
  })
  const [pagina, setPagina] = useState(1)
  const porPagina = 20

  const [modalFormAbierto, setModalFormAbierto] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [modalIngresoAbierto, setModalIngresoAbierto] = useState(false)
  const [modalAjusteAbierto, setModalAjusteAbierto] = useState(false)
  const [modalKardexAbierto, setModalKardexAbierto] = useState(false)

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategoriasApi,
  })

  const { data: productosData, isLoading } = useQuery({
    queryKey: ['productos', pagina, busqueda, categoriaId, estadoStock],
    queryFn: () =>
      listarProductosApi({
        skip: (pagina - 1) * porPagina,
        limit: porPagina,
        q: busqueda.trim() || undefined,
        categoria_id: categoriaId,
        estado_stock: estadoStock,
      }),
  })

  const invalidarCachesInventario = () => {
    queryClient.invalidateQueries({ queryKey: ['productos'] })
    queryClient.invalidateQueries({ queryKey: ['productos-pos'] })
    queryClient.invalidateQueries({ queryKey: ['productos-dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['kardex'] })
    queryClient.invalidateQueries({ queryKey: ['reportes-alertas-stock'] })
    queryClient.invalidateQueries({ queryKey: ['reportes-kpis'] })
  }

  const crearMutation = useMutation({
    mutationFn: crearProductoApi,
    onSuccess: invalidarCachesInventario,
  })

  const actualizarMutation = useMutation({
    mutationFn: ({
      id,
      datos,
    }: {
      id: number
      datos: Parameters<typeof actualizarProductoApi>[1]
    }) => actualizarProductoApi(id, datos),
    onSuccess: invalidarCachesInventario,
  })

  const ingresoMutation = useMutation({
    mutationFn: ({
      id,
      datos,
    }: {
      id: number
      datos: Parameters<typeof registrarIngresoStockApi>[1]
    }) => registrarIngresoStockApi(id, datos),
    onSuccess: invalidarCachesInventario,
  })

  const ajusteMutation = useMutation({
    mutationFn: ({
      id,
      datos,
    }: {
      id: number
      datos: Parameters<typeof registrarAjusteStockApi>[1]
    }) => registrarAjusteStockApi(id, datos),
    onSuccess: invalidarCachesInventario,
  })

  const productos = productosData?.items || []
  const total = productosData?.total || 0
  const totalPaginas = Math.ceil(total / porPagina) || 1
  const puedeGestionarAlmacen = tieneRol('administrador', 'almacenero')

  const abrirCrear = () => {
    setProductoSeleccionado(null)
    setModalFormAbierto(true)
  }

  const abrirEditar = (p: Producto) => {
    setProductoSeleccionado(p)
    setModalFormAbierto(true)
  }

  const abrirIngreso = (p: Producto) => {
    setProductoSeleccionado(p)
    setModalIngresoAbierto(true)
  }

  const abrirAjuste = (p: Producto) => {
    setProductoSeleccionado(p)
    setModalAjusteAbierto(true)
  }

  const abrirKardex = (p: Producto) => {
    setProductoSeleccionado(p)
    setModalKardexAbierto(true)
  }

  const cambiarEstadoStock = (nuevoEstado: EstadoStock | undefined) => {
    setEstadoStock(nuevoEstado)
    setPagina(1)
    if (searchParams.has('estado_stock')) {
      searchParams.delete('estado_stock')
      setSearchParams(searchParams, { replace: true })
    }
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setCategoriaId(undefined)
    setEstadoStock(undefined)
    setPagina(1)
    setSearchParams({}, { replace: true })
  }

  const handleGuardarProducto = async (datos: {
    sku: string
    nombre: string
    descripcion?: string
    categoria_id: number
    unidad: UnidadMedida
    precio: number
    stock_actual?: number
    stock_minimo: number
  }) => {
    if (productoSeleccionado) {
      await actualizarMutation.mutateAsync({
        id: productoSeleccionado.id,
        datos: {
          nombre: datos.nombre,
          descripcion: datos.descripcion,
          categoria_id: datos.categoria_id,
          unidad: datos.unidad,
          precio: datos.precio,
          stock_minimo: datos.stock_minimo,
        },
      })
    } else {
      await crearMutation.mutateAsync({
        sku: datos.sku,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        categoria_id: datos.categoria_id,
        unidad: datos.unidad,
        precio: datos.precio,
        stock_actual: datos.stock_actual || 0,
        stock_minimo: datos.stock_minimo,
      })
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        titulo="Catálogo de Telas, Hilados y Avíos"
        subtitulo="Ficha técnica de materiales, control de existencias por unidad y registro de movimientos"
      />

      <main className="p-6 space-y-5">
        {/* Panel de Búsqueda, Filtro de Estado y Pestañas de Familias Textiles */}
        <div className="card-textil p-4 rounded-2xl space-y-3.5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Buscador Principal con Relieve */}
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#2452E8]" />
              <input
                type="text"
                placeholder="Buscar por código SKU, tipo de tela, hilado o especificación..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setPagina(1)
                }}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl input-textil font-medium"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda('')
                    setPagina(1)
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-[#1B2A4A] cursor-pointer"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 justify-between lg:justify-end">
              {/* Filtro segmentado de Estado de Stock con Pista Táctil */}
              <div className="inline-flex items-center pista-segmentos p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => cambiarEstadoStock(undefined)}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                    estadoStock === undefined
                      ? 'btn-indigo font-bold'
                      : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-white/60'
                  }`}
                >
                  Todos ({total})
                </button>
                <button
                  type="button"
                  onClick={() => cambiarEstadoStock('normal')}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                    estadoStock === 'normal'
                      ? 'bg-[#15803D] text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-[#15803D] hover:bg-white/60'
                  }`}
                >
                  Conformes
                </button>
                <button
                  type="button"
                  onClick={() => cambiarEstadoStock('bajo')}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                    estadoStock === 'bajo'
                      ? 'bg-[#D97706] text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-[#B45309] hover:bg-white/60'
                  }`}
                >
                  Bajo mínimo
                </button>
                <button
                  type="button"
                  onClick={() => cambiarEstadoStock('agotado')}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                    estadoStock === 'agotado'
                      ? 'bg-[#DC2626] text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-[#B91C1C] hover:bg-white/60'
                  }`}
                >
                  Agotados
                </button>
              </div>

              {/* Botón Principal de Nuevo Producto con relieve Terracota */}
              {puedeGestionarAlmacen && (
                <button
                  onClick={abrirCrear}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl btn-terracota text-xs font-bold shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Nuevo Producto</span>
                </button>
              )}
            </div>
          </div>

          {/* Barra de Familias Textiles con Botones Táctiles */}
          <div className="pt-3 border-t border-[#E5E0D5] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">
                Familias:
              </span>
              <button
                type="button"
                onClick={() => {
                  setCategoriaId(undefined)
                  setPagina(1)
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  categoriaId === undefined
                    ? 'btn-indigo font-bold'
                    : 'btn-superficie text-slate-600 hover:text-[#1B2A4A]'
                }`}
              >
                Todas las familias
              </button>
              {categorias.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCategoriaId(c.id)
                    setPagina(1)
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    categoriaId === c.id
                      ? 'btn-indigo font-bold'
                      : 'btn-superficie text-slate-600 hover:text-[#1B2A4A]'
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>

            {(busqueda || categoriaId || estadoStock) && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="px-3 py-1 rounded-lg text-xs font-bold text-[#2452E8] hover:bg-[#2452E8]/8 transition-colors shrink-0 cursor-pointer"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        </div>

        {/* Tabla Técnica de Inventario Textil */}
        <div className="card-textil rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gradient-to-b from-[#F5F3EE] to-[#ECE8DF] border-b border-[#DED9CE] text-[#1B2A4A] font-bold text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-28 whitespace-nowrap">Código SKU</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Especificación del Artículo</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Familia y Presentación</th>
                  <th className="py-3.5 px-4 w-56 whitespace-nowrap">Existencia Fís. vs Mínimo</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Precio Unitario</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Operaciones de Almacén</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D5]/70">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#2452E8]" />
                        <span className="font-semibold text-xs text-[#1B2A4A]">
                          Consultando existencias del almacén...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : productos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-[#1B2A4A]">
                        No se encontraron artículos con esos criterios
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pruebe cambiando la familia textil o limpiando el filtro activo.
                      </p>
                    </td>
                  </tr>
                ) : (
                  productos.map((p) => {
                    const agotado = p.estado_stock === 'agotado' || p.stock_actual === 0
                    const bajo = p.estado_stock === 'bajo' && !agotado
                    const refMax = Math.max(p.stock_minimo * 2, p.stock_actual, 1)
                    const pctBarra = Math.min(100, Math.round((p.stock_actual / refMax) * 100))

                    return (
                      <tr key={p.id} className="group fila-interactiva">
                        <td className="py-3 px-4 whitespace-nowrap align-middle">
                          <span className="font-mono font-bold text-[#1B2A4A] bg-[#F2F0EA] group-hover:bg-[#1B2A4A] group-hover:text-white px-2 py-0.5 rounded-md transition-colors text-xs">
                            {p.sku}
                          </span>
                        </td>

                        <td className="py-3 px-4 align-middle">
                          <p className="font-bold text-[#1B2A4A] group-hover:text-[#2452E8] transition-colors leading-snug">
                            {p.nombre}
                          </p>
                          {p.descripcion && (
                            <p className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">
                              {p.descripcion}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap align-middle">
                          <p className="font-semibold text-[#1B2A4A]">
                            {p.categoria_nombre || 'General'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {PRESENTACION_TEXTIL[p.unidad] || `Por ${p.unidad}`}
                          </p>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap align-middle">
                          <div className="flex items-baseline justify-between gap-2">
                            <span
                              className={`text-xs font-extrabold tabular-nums ${
                                agotado
                                  ? 'text-[#B91C1C]'
                                  : bajo
                                    ? 'text-[#B45309]'
                                    : 'text-[#15803D]'
                              }`}
                            >
                              {p.stock_actual} {p.unidad}
                              {p.stock_actual === 1 ? '' : 's'}
                            </span>
                            <span className="text-[11px] text-slate-400 tabular-nums">
                              Mín. {p.stock_minimo}
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 w-full bg-[#ECE8DF] rounded-full overflow-hidden shadow-inner">
                            <div
                              style={{ width: `${agotado ? 4 : pctBarra}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${
                                agotado
                                  ? 'bg-[#DC2626]'
                                  : bajo
                                    ? 'bg-[#D97706]'
                                    : 'bg-[#15803D]'
                              }`}
                            />
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap align-middle">
                          <span className="font-extrabold text-[#1B2A4A] tabular-nums text-xs">
                            {formatearMoneda(p.precio)}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            por {p.unidad}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap align-middle">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              title="Consultar historial de movimientos (Kardex)"
                              onClick={() => abrirKardex(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg btn-superficie"
                            >
                              <History className="w-3.5 h-3.5 text-[#2452E8]" />
                              <span>Kardex</span>
                            </button>

                            {puedeGestionarAlmacen && (
                              <>
                                <button
                                  title="Registrar entrada de rollos o conos"
                                  onClick={() => abrirIngreso(p)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-[#15803D] bg-[#DCFCE7]/80 hover:bg-[#15803D] hover:text-white border border-[#15803D]/25 rounded-lg shadow-2xs transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
                                >
                                  <ArrowDownCircle className="w-3.5 h-3.5" />
                                  <span>Ingreso</span>
                                </button>
                                <button
                                  title="Ajuste manual de inventario"
                                  onClick={() => abrirAjuste(p)}
                                  className="p-1.5 text-slate-600 hover:text-[#B45309] bg-white hover:bg-[#FEF3C7] border border-[#DDD8CC] hover:border-[#D97706]/40 rounded-lg transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  title="Editar ficha técnica y precio"
                                  onClick={() => abrirEditar(p)}
                                  className="p-1.5 text-slate-600 hover:text-white bg-white hover:bg-[#2452E8] border border-[#DDD8CC] hover:border-[#2452E8] rounded-lg transition-all duration-150 hover:-translate-y-0.5 cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {total > porPagina && (
            <div className="p-3.5 bg-[#F2F0EA]/70 border-t border-[#E5E0D5] flex items-center justify-between text-xs text-slate-600">
              <div>
                Mostrando <span className="font-bold text-[#1B2A4A]">{productos.length}</span> de{' '}
                <span className="font-bold text-[#1B2A4A]">{total}</span> artículos registrados
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold btn-superficie"
                >
                  Anterior
                </button>
                <span className="font-bold text-[#1B2A4A] tabular-nums px-2">
                  {pagina} / {totalPaginas}
                </span>
                <button
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold btn-superficie"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modales */}
      <ProductoFormModal
        abierto={modalFormAbierto}
        productoAEditar={productoSeleccionado}
        categorias={categorias}
        alCerrar={() => setModalFormAbierto(false)}
        alGuardar={handleGuardarProducto}
      />

      <IngresoStockModal
        abierto={modalIngresoAbierto}
        producto={productoSeleccionado}
        alCerrar={() => setModalIngresoAbierto(false)}
        alGuardar={async (id, datos) => {
          await ingresoMutation.mutateAsync({ id, datos })
        }}
      />

      <AjusteStockModal
        abierto={modalAjusteAbierto}
        producto={productoSeleccionado}
        alCerrar={() => setModalAjusteAbierto(false)}
        alGuardar={async (id, datos) => {
          await ajusteMutation.mutateAsync({ id, datos })
        }}
      />

      <KardexModal
        abierto={modalKardexAbierto}
        producto={productoSeleccionado}
        alCerrar={() => setModalKardexAbierto(false)}
      />
    </div>
  )
}
