import React, { useState } from 'react'
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
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Package,
} from 'lucide-react'

export const InventarioPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { tieneRol } = useAuth()

  // Filtros de búsqueda
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)
  const [estadoStock, setEstadoStock] = useState<EstadoStock | undefined>(undefined)
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

  // Mutación: Crear producto
  const crearMutation = useMutation({
    mutationFn: crearProductoApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-dashboard'] })
    },
  })

  // Mutación: Actualizar producto
  const actualizarMutation = useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: Parameters<typeof actualizarProductoApi>[1] }) =>
      actualizarProductoApi(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })

  // Mutación: Ingreso de stock
  const ingresoMutation = useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: Parameters<typeof registrarIngresoStockApi>[1] }) =>
      registrarIngresoStockApi(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-dashboard'] })
    },
  })

  // Mutación: Ajuste de stock
  const ajusteMutation = useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: Parameters<typeof registrarAjusteStockApi>[1] }) =>
      registrarAjusteStockApi(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-dashboard'] })
    },
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span className="tabular-nums">{actual} {unidad}(s)</span>
          </span>
        )
      case 'bajo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span className="tabular-nums">{actual} {unidad}(s) · Bajo</span>
          </span>
        )
      case 'agotado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>0 {unidad}(s) · Agotado</span>
          </span>
        )
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        titulo="Catálogo e Inventario Textil"
        subtitulo="Gestión de rollos, conos de hilo, avíos y control de existencias en tiempo real (P-03)"
      />

      <main className="p-6 space-y-4">
        {/* Barra superior de herramientas y filtros */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 flex flex-wrap items-center gap-2">
            {/* Buscador debounced */}
            <div className="relative min-w-[240px] flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por SKU o descripción de tela / hilo..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setPagina(1)
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none"
              />
            </div>

            {/* Filtro por Categoría */}
            <select
              value={categoriaId || ''}
              onChange={(e) => {
                setCategoriaId(e.target.value ? Number(e.target.value) : undefined)
                setPagina(1)
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-white text-slate-700"
            >
              <option value="">Todas las Familias</option>
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
                setEstadoStock((e.target.value as EstadoStock) || undefined)
                setPagina(1)
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-white text-slate-700"
            >
              <option value="">Todo el Stock</option>
              <option value="normal">Stock Normal</option>
              <option value="bajo">Stock Bajo</option>
              <option value="agotado">Agotados</option>
            </select>
          </div>

          {/* Botón Nuevo Producto (Admin o Almacén) */}
          {tieneRol('administrador', 'almacenero') && (
            <button
              onClick={abrirCrear}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold shadow-xs shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto (P-04)</span>
            </button>
          )}
        </div>

        {/* Tabla de Productos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Nombre y Detalle</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Unidad</th>
                  <th className="py-3 px-4 text-right">Precio Unit. (S/)</th>
                  <th className="py-3 px-4 text-center">Stock Actual</th>
                  <th className="py-3 px-4 text-right">Mínimo</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-900" />
                        <span>Cargando catálogo...</span>
                      </div>
                    </td>
                  </tr>
                ) : productos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium">No se encontraron productos textiles.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Pruebe ajustando los filtros de búsqueda.</p>
                    </td>
                  </tr>
                ) : (
                  productos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.sku}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-sm">{p.nombre}</p>
                        {p.descripcion && (
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">{p.descripcion}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {p.categoria_nombre || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize font-medium text-slate-700">{p.unidad}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums text-sm">
                        {formatearMoneda(p.precio)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {renderBadgeStock(p.estado_stock, p.stock_actual, p.unidad)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-500 font-medium">
                        {p.stock_minimo}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Botón Ver Kardex (Todos los roles) */}
                          <button
                            title="Ver Kardex de movimientos"
                            onClick={() => abrirKardex(p)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Botones Almacén/Admin */}
                          {tieneRol('administrador', 'almacenero') && (
                            <>
                              <button
                                title="Registrar Ingreso de Stock"
                                onClick={() => abrirIngreso(p)}
                                className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-md transition-colors"
                              >
                                <ArrowDownCircle className="w-4 h-4" />
                              </button>
                              <button
                                title="Ajuste manual de stock"
                                onClick={() => abrirAjuste(p)}
                                className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-md transition-colors"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>
                              <button
                                title="Editar producto"
                                onClick={() => abrirEditar(p)}
                                className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
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
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Mostrando {productos.length} de {total} productos
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="font-semibold text-slate-800">
                  {pagina} / {totalPaginas}
                </span>
                <button
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
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
