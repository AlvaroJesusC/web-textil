import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/features/auth'
import { listarProductosApi } from '@/features/inventario/api'
import { registrarVentaApi } from '../api'
import type { Producto, MetodoPago, Venta } from '@/types'
import { formatearMoneda } from '@/lib/formato'
import { ComprobanteModal } from '../components/ComprobanteModal'
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  Loader2,
  Zap,
} from 'lucide-react'

interface ItemCarrito {
  producto: Producto
  cantidad: number
}

export const RegistrarVentaPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()
  const buscadorInputRef = useRef<HTMLInputElement>(null)

  // Búsqueda de productos
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)

  // Carrito de ventas
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [descuentoPct, setDescuentoPct] = useState<number>(0)
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteDocumento, setClienteDocumento] = useState('')

  // Estados de proceso y feedback
  const [errorVenta, setErrorVenta] = useState<string | null>(null)
  const [ventaConfirmada, setVentaConfirmada] = useState<Venta | null>(null)
  const [modalComprobanteAbierto, setModalComprobanteAbierto] = useState(false)

  // Consultar productos disponibles (solo activos y con stock)
  const { data: productosData, isLoading: cargandoProductos } = useQuery({
    queryKey: ['productos-pos', busqueda, categoriaId],
    queryFn: () =>
      listarProductosApi({
        q: busqueda.trim() || undefined,
        categoria_id: categoriaId,
        solo_activos: true,
        limit: 50,
      }),
  })

  // Mutación de registro de venta
  const ventaMutation = useMutation({
    mutationFn: registrarVentaApi,
    onSuccess: (ventaRegistrada) => {
      setVentaConfirmada(ventaRegistrada)
      setModalComprobanteAbierto(true)
      // Invalidar productos para reflejar nuevo stock descontado
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-pos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
    },
    onError: (err: unknown) => {
      const apiErr = err as { detalle?: string }
      setErrorVenta(apiErr.detalle || 'Error al procesar la venta.')
    },
  })

  // Confirmar Venta
  const handleConfirmarVenta = useCallback(() => {
    if (carrito.length === 0) return
    setErrorVenta(null)

    ventaMutation.mutate({
      items: carrito.map((item) => ({
        producto_id: item.producto.id,
        cantidad: item.cantidad,
      })),
      descuento_pct: descuentoPct,
      metodo_pago: metodoPago,
      cliente_nombre: clienteNombre.trim() || undefined,
      cliente_documento: clienteDocumento.trim() || undefined,
    })
  }, [carrito, descuentoPct, metodoPago, clienteNombre, clienteDocumento, ventaMutation])

  // Atajos de teclado: '/' enfoca el buscador, 'Ctrl+Enter' confirma la venta
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== buscadorInputRef.current) {
        e.preventDefault()
        buscadorInputRef.current?.focus()
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (carrito.length > 0 && !ventaMutation.isPending) {
          handleConfirmarVenta()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [carrito.length, ventaMutation.isPending, handleConfirmarVenta])

  // Lógica de tope de descuento según rol (RN-03: Vendedor max 10%, Admin max 100%)
  const topeDescuento = usuario?.rol === 'administrador' ? 100 : 10

  const handleCambioDescuento = (valor: number) => {
    if (isNaN(valor)) {
      setDescuentoPct(0)
      return
    }
    if (valor > topeDescuento) {
      setDescuentoPct(topeDescuento)
    } else if (valor < 0) {
      setDescuentoPct(0)
    } else {
      setDescuentoPct(valor)
    }
  }

  // Agregar al carrito
  const agregarAlCarrito = (producto: Producto) => {
    setErrorVenta(null)
    setCarrito((actual) => {
      const index = actual.findIndex((item) => item.producto.id === producto.id)
      if (index >= 0) {
        const itemActual = actual[index]
        const nuevaCantidad = itemActual.cantidad + 1
        if (nuevaCantidad > producto.stock_actual) {
          setErrorVenta(`Stock insuficiente: Solo hay ${producto.stock_actual} ${producto.unidad}(s) disponibles de ${producto.nombre}.`)
          return actual
        }
        const nuevoCarrito = [...actual]
        nuevoCarrito[index] = { ...itemActual, cantidad: nuevaCantidad }
        return nuevoCarrito
      } else {
        if (producto.stock_actual < 1) {
          setErrorVenta(`El producto ${producto.nombre} está agotado en almacén.`)
          return actual
        }
        return [...actual, { producto, cantidad: 1 }]
      }
    })
  }

  // Modificar cantidad en carrito
  const actualizarCantidad = (productoId: number, cantidad: number) => {
    setErrorVenta(null)
    setCarrito((actual) =>
      actual
        .map((item) => {
          if (item.producto.id === productoId) {
            if (cantidad > item.producto.stock_actual) {
              setErrorVenta(
                `Solo hay ${item.producto.stock_actual} ${item.producto.unidad}(s) disponibles de ${item.producto.nombre}.`
              )
              return { ...item, cantidad: item.producto.stock_actual }
            }
            return { ...item, cantidad: Math.max(1, cantidad) }
          }
          return item
        })
        .filter((item) => item.cantidad > 0)
    )
  }

  // Quitar del carrito
  const quitarDelCarrito = (productoId: number) => {
    setCarrito((actual) => actual.filter((item) => item.producto.id !== productoId))
  }

  // Limpiar carrito
  const limpiarCarrito = () => {
    setCarrito([])
    setErrorVenta(null)
    setDescuentoPct(0)
    setClienteNombre('')
    setClienteDocumento('')
  }

  // Cálculos en vivo para vista previa (el servidor calcula el definitivo)
  const subtotalBruto = carrito.reduce(
    (acc, item) => acc + item.cantidad * parseFloat(item.producto.precio),
    0
  )
  const montoDescuento = subtotalBruto * (descuentoPct / 100)
  const baseImponible = subtotalBruto - montoDescuento
  const montoIgv = baseImponible * 0.18
  const totalEstimado = baseImponible + montoIgv


  const handleNuevaVenta = () => {
    limpiarCarrito()
    setModalComprobanteAbierto(false)
    setVentaConfirmada(null)
    buscadorInputRef.current?.focus()
  }

  const productos = productosData?.items || []

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <Header
        titulo="Caja y Punto de Venta"
        subtitulo="Venta rápida de mostrador con atajos de teclado y cálculo de IGV 18%"
      />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Columna Izquierda: Buscador y Catálogo de Productos (60%) */}
        <section className="flex-1 flex flex-col min-h-0 border-r border-slate-200 bg-white overflow-hidden">
          {/* Barra de Búsqueda y Filtros Rápidos */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                ref={buscadorInputRef}
                type="text"
                placeholder="Buscar por SKU o descripción de tela... (Presiona '/' para buscar)"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-12 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 focus:outline-none bg-white font-medium"
              />
              <span className="absolute right-3 top-2.5 px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 border border-slate-300 rounded text-slate-500 font-semibold">
                /
              </span>
            </div>

            {/* Selector de categorías */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setCategoriaId(undefined)}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${
                  categoriaId === undefined
                    ? 'bg-blue-900 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Todas las Telas / Artículos
              </button>
              <button
                onClick={() => setCategoriaId(1)}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${
                  categoriaId === 1
                    ? 'bg-blue-900 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Telas Planas y Punto
              </button>
              <button
                onClick={() => setCategoriaId(2)}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${
                  categoriaId === 2
                    ? 'bg-blue-900 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Hilos y Conos
              </button>
              <button
                onClick={() => setCategoriaId(3)}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${
                  categoriaId === 3
                    ? 'bg-blue-900 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Avíos y Botonería
              </button>
            </div>
          </div>

          {/* Grilla de Productos disponibles para agregar */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {cargandoProductos ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
                <span className="text-sm">Buscando productos...</span>
              </div>
            ) : productos.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <p className="text-sm">No se encontraron productos disponibles.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {productos.map((prod) => {
                  const agotado = prod.stock_actual <= 0
                  return (
                    <div
                      key={prod.id}
                      onClick={() => !agotado && agregarAlCarrito(prod)}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all select-none ${
                        agotado
                          ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:border-blue-700 hover:shadow-xs cursor-pointer active:scale-[0.99]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-mono font-bold text-slate-500">{prod.sku}</span>
                          <span
                            className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                              agotado
                                ? 'bg-rose-100 text-rose-800'
                                : prod.stock_actual <= prod.stock_minimo
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {agotado ? 'Agotado' : `${prod.stock_actual} ${prod.unidad}(s)`}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                          {prod.nombre}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium capitalize">
                          Por {prod.unidad}
                        </span>
                        <span className="text-sm font-bold text-blue-950 tabular-nums">
                          {formatearMoneda(prod.precio)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Columna Derecha: Carrito, Totales y Confirmación de Venta (40%) */}
        <section className="w-full lg:w-[420px] xl:w-[450px] bg-slate-50 flex flex-col min-h-0 border-t lg:border-t-0 overflow-hidden shadow-lg shrink-0">
          {/* Encabezado del Carrito */}
          <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-900" />
              <h3 className="font-bold text-sm text-slate-900">Carrito de Venta</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 tabular-nums">
                {carrito.length}
              </span>
            </div>
            {carrito.length > 0 && (
              <button
                onClick={limpiarCarrito}
                className="text-xs text-rose-700 hover:text-rose-900 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar</span>
              </button>
            )}
          </div>

          {/* Alerta de Error si ocurre */}
          {errorVenta && (
            <div className="mx-4 mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorVenta}</span>
            </div>
          )}

          {/* Lista de Ítems en el Carrito */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 py-6">
                <ShoppingCart className="w-10 h-10 text-slate-300 stroke-1" />
                <p className="text-xs font-medium">El carrito está vacío.</p>
                <p className="text-[11px] text-slate-400 text-center max-w-[200px]">
                  Haga clic en un producto o use la barra de búsqueda para comenzar la venta.
                </p>
              </div>
            ) : (
              carrito.map((item) => {
                const subtotalItem = item.cantidad * parseFloat(item.producto.precio)
                return (
                  <div
                    key={item.producto.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono text-slate-500 font-semibold">
                          {item.producto.sku}
                        </span>
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.producto.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatearMoneda(item.producto.precio)} / {item.producto.unidad}
                        </p>
                      </div>
                      <button
                        onClick={() => quitarDelCarrito(item.producto.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Quitar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      {/* Control de cantidad */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 active:bg-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.producto.stock_actual}
                          value={item.cantidad}
                          onChange={(e) =>
                            actualizarCantidad(item.producto.id, parseInt(e.target.value, 10) || 1)
                          }
                          className="w-12 text-center text-xs font-bold bg-white py-1 focus:outline-none tabular-nums"
                        />
                        <button
                          onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 active:bg-slate-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal del ítem */}
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        {formatearMoneda(subtotalItem)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Formulario de Pago y Resumen de Totales */}
          <div className="p-4 bg-white border-t border-slate-200 space-y-3 shrink-0">
            {/* Cliente (Opcional) */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nombre cliente"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-800"
              />
              <input
                type="text"
                placeholder="DNI / RUC"
                value={clienteDocumento}
                onChange={(e) => setClienteDocumento(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-800 font-mono"
              />
            </div>

            {/* Método de pago y Descuento */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Método de Pago
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-800 bg-white"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="yape_plin">Yape / Plin</option>
                  <option value="tarjeta">Tarjeta Débito/Crédito</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Descuento ({descuentoPct}%) · Máx {topeDescuento}%
                </label>
                <input
                  type="number"
                  min="0"
                  max={topeDescuento}
                  value={descuentoPct}
                  onChange={(e) => handleCambioDescuento(parseFloat(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-800 tabular-nums"
                />
              </div>
            </div>

            {/* Desglose de totales en vivo */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal bruto:</span>
                <span className="tabular-nums">{formatearMoneda(subtotalBruto)}</span>
              </div>
              {descuentoPct > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Descuento ({descuentoPct}%):</span>
                  <span className="tabular-nums">- {formatearMoneda(montoDescuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>IGV (18% incluido en total):</span>
                <span className="tabular-nums">{formatearMoneda(montoIgv)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>TOTAL A PAGAR:</span>
                <span className="text-blue-900 tabular-nums font-mono">
                  {formatearMoneda(totalEstimado)}
                </span>
              </div>
            </div>

            {/* Botón Principal de Confirmación */}
            <button
              onClick={handleConfirmarVenta}
              disabled={carrito.length === 0 || ventaMutation.isPending}
              className="w-full py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {ventaMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando venta y stock...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Confirmar Venta</span>
                  <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-blue-950/60 rounded border border-blue-700/50 text-blue-200">
                    Ctrl + Enter
                  </kbd>
                </>
              )}
            </button>
          </div>
        </section>
      </div>

      {/* Modal de Comprobante / Venta Exitosa */}
      <ComprobanteModal
        abierto={modalComprobanteAbierto}
        venta={ventaConfirmada}
        alCerrar={() => setModalComprobanteAbierto(false)}
        alNuevaVenta={handleNuevaVenta}
      />
    </div>
  )
}
