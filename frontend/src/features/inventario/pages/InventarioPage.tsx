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
} from 'lucide-react'

export const InventarioPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { tieneRol } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // Filtros de búsqueda sincronizados con parámetros de navegación
  const [busqueda, setBusqueda] = useState(() => searchParams.get('q') || '')
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)
  const [estadoStock, setEstadoStock] = useState<EstadoStock | undefined>(() => {
    const est = searchParams.get('estado_stock')
    return est === 'normal' || est === 'bajo' || est === 'agotado' ? est : undefined
  })
  const [pagina, setPagina] = useState(1)
  const porPagina = 20

  // Modales
  const [modalFormAbierto, setModalFormAbierto] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)

  const [modalIngresoAbierto, setModalIngresoAbierto] = useState(false)
  const [modalAjusteAbierto, setModalAjusteAbierto] = useState(false)
  const [modalKardexAbierto, setModalKardexAbierto] = useState(false)

  // Consultar categorías
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategoriasApi,
  })

  // Consultar productos
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

  // Mutación: Crear producto
  const crearMutation = useMutation({
    mutationFn: crearProductoApi,
    onSuccess: invalidarCachesInventario,
  })

  // Mutación: Actualizar producto
  const actualizarMutation = useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: Parameters<typeof actualizarProductoApi>[1] }) =>
      actualizarProductoApi(id, datos),
    onSuccess: invalidarCachesInventario,
  })

  // Mutación: Ingreso de stock
  const ingresoMutation = useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: Parameters<typeof registrarIngresoStockApi>[1] }) =>
      registrarIngresoStockApi(id, datos),
    onSuccess: invalidarCachesInventario,
  })

  // Mutación: Ajuste de stock
  const ajusteMutation = useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: Parameters<typeof registrarAjusteStockApi>[1] }) =>
      registrarAjusteStockApi(id, datos),
    onSuccess: invalidarCachesInventario,
  })

  const productos = productosData?.items || []
  const total = productosData?.total || 0
  const totalPaginas = Math.ceil(total / porPagina) || 1

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

  const renderBadgeStock = (estado: EstadoStock, actual: number, unidad: string) => {
    switch (estado) {
      case 'normal':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#DCFCE7] text-[#15803D] whitespace-nowrap">
            <span className="tabular-nums">{actual}</span>
            <span className="ml-1 text-[11px] font-medium">{unidad}</span>
          </span>
        )
      case 'bajo':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#FEF3C7] text-[#B45309] whitespace-nowrap">
            <span className="tabular-nums">{actual}</span>
            <span className="ml-1 text-[11px] font-semibold">{unidad} · Bajo</span>
          </span>
        )
      case 'agotado':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#FEE2E2] text-[#B91C1C] whitespace-nowrap">
            <span className="tabular-nums">0</span>
            <span className="ml-1 text-[11px] font-semibold">Agotado</span>
          </span>
        )
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F9F8F5]">
      <Header
        titulo="Inventario Textil y Catálogo"
        subtitulo="Control de rollos, conos de hilo, avíos y consulta de existencias en tiempo real"
      />

      <main className="p-6 space-y-5">
        {/* Barra superior de filtros en tarjeta blanca rounded-xl */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E3DC] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 flex flex-wrap items-center gap-2.5">
            {/* Buscador estilizado con foco #2452E8 */}
            <div className="relative min-w-[240px] flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#2452E8]" />
              <input
                type="text"
                placeholder="Buscar por SKU o descripción de artículo..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setPagina(1)
                }}
                className="w-full pl-9 pr-3.5 py-2 text-xs border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none bg-[#F9F8F5] focus:bg-white text-[#1B2A4A] transition-all duration-150"
              />
            </div>

            {/* Filtro por Categoría */}
            <select
              value={categoriaId || ''}
              onChange={(e) => {
                setCategoriaId(e.target.value ? Number(e.target.value) : undefined)
                setPagina(1)
              }}
              className="px-3 py-2 text-xs font-medium border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none bg-white text-[#1B2A4A] transition-all duration-150"
            >
              <option value="">Todas las familias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            {/* Filtro por Estado de Stock */}
            <select
              value={estadoStock || ''}
              onChange={(e) => {
                const val = (e.target.value as EstadoStock) || undefined
                setEstadoStock(val)
                setPagina(1)
                if (searchParams.has('estado_stock')) {
                  searchParams.delete('estado_stock')
                  setSearchParams(searchParams, { replace: true })
                }
              }}
              className="px-3 py-2 text-xs font-medium border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none bg-white text-[#1B2A4A] transition-all duration-150"
            >
              <option value="">Todo el stock</option>
              <option value="normal">Stock Conforme</option>
              <option value="bajo">Stock Bajo</option>
              <option value="agotado">Agotados (0)</option>
            </select>

            {(busqueda || categoriaId || estadoStock) && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('')
                  setCategoriaId(undefined)
                  setEstadoStock(undefined)
                  setPagina(1)
                  setSearchParams({}, { replace: true })
                }}
                className="px-2.5 py-2 text-xs font-semibold text-[#2452E8] hover:underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Botón Nuevo Producto en Terracota #D95D39 */}
          {tieneRol('administrador', 'almacenero') && (
            <button
              onClick={abrirCrear}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#D95D39] hover:bg-[#C24D2B] text-white text-xs font-bold shadow-sm shrink-0 transition-all duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Producto</span>
            </button>
          )}
        </div>

        {/* Tabla de Productos con rounded-xl shadow-sm y cabecera #F2F0EA */}
        <div className="bg-white rounded-xl border border-[#E6E3DC] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F2F0EA] border-b border-[#E6E3DC] text-[#1B2A4A] font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-28 whitespace-nowrap">SKU</th>
                  <th className="py-3 px-4 whitespace-nowrap">Artículo y Descripción</th>
                  <th className="py-3 px-4 whitespace-nowrap">Familia</th>
                  <th className="py-3 px-4 w-24 whitespace-nowrap">Unidad</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Precio Unit. (S/)</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Stock Actual</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Mínimo</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E3DC]/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-[#2452E8]" />
                        <span className="font-semibold text-xs text-[#1B2A4A]">
                          Cargando catálogo textil...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : productos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-[#1B2A4A]">Sin coincidencias en el inventario</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Verifique los términos de búsqueda o filtros seleccionados.
                      </p>
                    </td>
                  </tr>
                ) : (
                  productos.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F9F8F5] transition-colors h-11">
                      <td className="py-2.5 px-4 font-mono font-semibold text-[#1B2A4A] text-xs whitespace-nowrap">
                        {p.sku}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-[#1B2A4A]">{p.nombre}</span>
                        {p.descripcion && (
                          <span className="text-[11px] text-slate-500 block truncate max-w-sm">
                            {p.descripcion}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#F2F0EA] border border-[#E6E3DC] text-[#1B2A4A] font-semibold text-[11px] whitespace-nowrap">
                          {p.categoria_nombre || 'General'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 capitalize text-slate-700 font-medium whitespace-nowrap">
                        {p.unidad}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-[#1B2A4A] tabular-nums text-xs whitespace-nowrap">
                        {formatearMoneda(p.precio)}
                      </td>
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        {renderBadgeStock(p.estado_stock, p.stock_actual, p.unidad)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-500 tabular-nums font-semibold whitespace-nowrap">
                        {p.stock_minimo}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Botón Ver Kardex */}
                          <button
                            title="Ver Kardex"
                            onClick={() => abrirKardex(p)}
                            className="p-1.5 text-[#1B2A4A] hover:bg-[#1B2A4A]/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Botones Almacén/Admin */}
                          {tieneRol('administrador', 'almacenero') && (
                            <>
                              <button
                                title="Ingreso de Stock"
                                onClick={() => abrirIngreso(p)}
                                className="p-1.5 text-[#15803D] hover:bg-[#DCFCE7] rounded-lg transition-colors cursor-pointer"
                              >
                                <ArrowDownCircle className="w-4 h-4" />
                              </button>
                              <button
                                title="Ajuste de Stock"
                                onClick={() => abrirAjuste(p)}
                                className="p-1.5 text-[#D97706] hover:bg-[#FEF3C7] rounded-lg transition-colors cursor-pointer"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>
                              <button
                                title="Editar Artículo"
                                onClick={() => abrirEditar(p)}
                                className="p-1.5 text-[#2452E8] hover:bg-[#2452E8]/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {total > porPagina && (
            <div className="p-3.5 bg-[#F2F0EA]/60 border-t border-[#E6E3DC] flex items-center justify-between text-xs text-slate-600">
              <div>
                Mostrando <span className="font-bold text-[#1B2A4A]">{productos.length}</span> de{' '}
                <span className="font-bold text-[#1B2A4A]">{total}</span> artículos
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                  className="px-3 py-1.5 bg-white border border-[#E6E3DC] rounded-lg text-xs font-semibold text-[#1B2A4A] hover:bg-[#F9F8F5] disabled:opacity-40 transition-colors"
                >
                  Anterior
                </button>
                <span className="font-bold text-[#1B2A4A] tabular-nums">
                  {pagina} / {totalPaginas}
                </span>
                <button
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                  className="px-3 py-1.5 bg-white border border-[#E6E3DC] rounded-lg text-xs font-semibold text-[#1B2A4A] hover:bg-[#F9F8F5] disabled:opacity-40 transition-colors"
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
