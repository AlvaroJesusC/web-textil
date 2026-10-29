import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/features/auth'
import { listarProductosApi, listarCategoriasApi } from '@/features/inventario/api'
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
  Check,
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

  // Consultar categorías reales del catálogo
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategoriasApi,
  })

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
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-pos'] })
      queryClient.invalidateQueries({ queryKey: ['productos-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
      queryClient.invalidateQueries({ queryKey: ['ventas-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['kardex'] })
      queryClient.invalidateQueries({ queryKey: ['reportes-kpis'] })
      queryClient.invalidateQueries({ queryKey: ['reportes-ventas-dia'] })
      queryClient.invalidateQueries({ queryKey: ['reportes-top-productos'] })
      queryClient.invalidateQueries({ queryKey: ['reportes-vendedores'] })
      queryClient.invalidateQueries({ queryKey: ['reportes-metodos-pago'] })
      queryClient.invalidateQueries({ queryKey: ['reportes-alertas-stock'] })
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
        handleConfirmarVenta()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleConfirmarVenta])

  // Tope de descuento según el rol
  const topeDescuento = usuario?.rol === 'administrador' || usuario?.rol === 'gerente' ? 30 : 10

  const handleCambioDescuento = (val: number) => {
    if (isNaN(val) || val < 0) {
      setDescuentoPct(0)
      return
    }
    if (val > topeDescuento) {
      setErrorVenta(`El descuento máximo autorizado para su rol es ${topeDescuento}%.`)
      setDescuentoPct(topeDescuento)
      return
    }
    setErrorVenta(null)
    setDescuentoPct(val)
  }

  // Agregar al carrito
  const agregarAlCarrito = (producto: Producto) => {
    setErrorVenta(null)
    setCarrito((actual) => {
      const existente = actual.find((item) => item.producto.id === producto.id)
      if (existente) {
        if (existente.cantidad >= producto.stock_actual) {
          setErrorVenta(
            `Stock máximo disponible alcanzado (${producto.stock_actual} ${producto.unidad}s).`
          )
          return actual
        }
        return actual.map((item) =>
          item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      } else {
        if (producto.stock_actual <= 0) {
          setErrorVenta(`El producto ${producto.nombre} no tiene stock disponible.`)
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

  // Cálculos en vivo para vista previa
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
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[#F9F8F5]">
      <Header
        titulo="Caja de Mostrador (POS)"
        subtitulo="Venta rápida con atajos de teclado, cálculo exacto de IGV 18% y descuento de inventario"
      />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Columna Izquierda: Buscador y Catálogo de Productos (60%) */}
        <section className="flex-1 flex flex-col min-h-0 border-r border-[#E6E3DC] bg-[#F9F8F5] overflow-hidden">
          {/* Barra de Búsqueda y Familias */}
          <div className="p-4 border-b border-[#E6E3DC] bg-white space-y-3 shrink-0 shadow-2xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#2452E8]" />
              <input
                ref={buscadorInputRef}
                type="text"
                placeholder="Buscar por SKU o descripción de tela... (Presiona '/' para buscar)"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-12 py-2 text-xs border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none bg-[#F9F8F5] focus:bg-white font-medium text-[#1B2A4A] transition-all"
              />
              <span className="absolute right-3 top-2 px-1.5 py-0.5 text-[10px] font-mono bg-white border border-[#E6E3DC] rounded text-[#1B2A4A] font-bold shadow-2xs">
                /
              </span>
            </div>

            {/* Selector dinámico de categorías */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 text-xs">
              <button
                onClick={() => setCategoriaId(undefined)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  categoriaId === undefined
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'bg-[#F9F8F5] border border-[#E6E3DC] text-[#1B2A4A] hover:bg-[#F2F0EA]'
                }`}
              >
                Todas las familias
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaId(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    categoriaId === cat.id
                      ? 'bg-[#1B2A4A] text-white shadow-xs'
                      : 'bg-[#F9F8F5] border border-[#E6E3DC] text-[#1B2A4A] hover:bg-[#F2F0EA]'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Cuadrícula de artículos disponibles con rounded-xl y borde #2452E8 al pasar cursor */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {cargandoProductos ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#2452E8]" />
                <span className="text-xs font-semibold text-[#1B2A4A]">Consultando catálogo...</span>
              </div>
            ) : productos.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <p className="text-xs font-medium">No se encontraron productos disponibles.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {productos.map((prod) => {
                  const agotado = prod.stock_actual <= 0
                  return (
                    <div
                      key={prod.id}
                      onClick={() => !agotado && agregarAlCarrito(prod)}
                      className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 select-none ${
                        agotado
                          ? 'border-[#E6E3DC] bg-white/50 opacity-50 cursor-not-allowed'
                          : 'border-[#E6E3DC] bg-white shadow-sm hover:border-[#2452E8] hover:shadow-md cursor-pointer active:scale-[0.99]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[11px] font-mono font-bold text-[#1B2A4A] bg-[#F2F0EA] px-1.5 py-0.5 rounded">
                            {prod.sku}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md tabular-nums ${
                              agotado
                                ? 'bg-[#FEE2E2] text-[#B91C1C]'
                                : prod.stock_actual <= prod.stock_minimo
                                  ? 'bg-[#FEF3C7] text-[#B45309]'
                                  : 'bg-[#DCFCE7] text-[#15803D]'
                            }`}
                          >
                            {agotado ? 'Agotado' : `${prod.stock_actual} ${prod.unidad}(s)`}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#1B2A4A] line-clamp-2 leading-snug">
                          {prod.nombre}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#E6E3DC]/60 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium capitalize">
                          Por {prod.unidad}
                        </span>
                        <span className="text-sm font-extrabold text-[#1B2A4A] tabular-nums">
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

        {/* Columna Derecha: Ticket / Carrito de Venta con cabecera en #1B2A4A */}
        <section className="w-full lg:w-[410px] xl:w-[450px] bg-white flex flex-col min-h-0 border-t lg:border-t-0 overflow-hidden shrink-0 shadow-md">
          {/* Cabecera del Ticket en #1B2A4A */}
          <div className="px-5 py-3.5 bg-[#1B2A4A] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-4 h-4 text-[#D95D39]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                Ticket de Mostrador
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#D95D39] text-white tabular-nums">
                {carrito.length}
              </span>
            </div>
            {carrito.length > 0 && (
              <button
                onClick={limpiarCarrito}
                className="text-xs text-rose-200 hover:text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar</span>
              </button>
            )}
          </div>

          {/* Alerta de Error */}
          {errorVenta && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-[#FEE2E2] border border-[#DC2626]/20 text-[#B91C1C] text-xs font-medium flex items-start gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626] mt-0.5" />
              <span>{errorVenta}</span>
            </div>
          )}

          {/* Lista de Ítems en el Carrito */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2.5 bg-[#F9F8F5]">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 py-6">
                <ShoppingCart className="w-10 h-10 text-slate-300 stroke-1" />
                <p className="text-xs font-bold text-[#1B2A4A]">Mostrador sin ítems</p>
                <p className="text-[11px] text-slate-500 text-center max-w-[220px]">
                  Seleccione artículos en el catálogo o presione / para buscar por SKU.
                </p>
              </div>
            ) : (
              carrito.map((item) => {
                const subtotalItem = item.cantidad * parseFloat(item.producto.precio)
                return (
                  <div
                    key={item.producto.id}
                    className="p-3 bg-white rounded-xl border border-[#E6E3DC] shadow-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono text-[#2452E8] font-bold">
                          {item.producto.sku}
                        </span>
                        <p className="text-xs font-bold text-[#1B2A4A] truncate">
                          {item.producto.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium tabular-nums">
                          {formatearMoneda(item.producto.precio)} / {item.producto.unidad}
                        </p>
                      </div>
                      <button
                        onClick={() => quitarDelCarrito(item.producto.id)}
                        className="text-slate-400 hover:text-[#DC2626] p-1 rounded-md hover:bg-[#FEE2E2]/50 transition-colors"
                        title="Quitar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-[#E6E3DC]/60">
                      {/* Control de cantidad */}
                      <div className="flex items-center border border-[#E6E3DC] rounded-lg overflow-hidden bg-[#F9F8F5]">
                        <button
                          onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                          className="px-2.5 py-1 text-[#1B2A4A] hover:bg-[#E6E3DC] transition-colors"
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
                          className="w-12 text-center text-xs font-bold bg-white py-1 text-[#1B2A4A] focus:outline-none tabular-nums"
                        />
                        <button
                          onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                          className="px-2.5 py-1 text-[#1B2A4A] hover:bg-[#E6E3DC] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal del ítem */}
                      <span className="text-xs font-extrabold text-[#1B2A4A] tabular-nums">
                        {formatearMoneda(subtotalItem)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Formulario de Pago y Resumen Contable */}
          <div className="p-4 bg-white border-t border-[#E6E3DC] space-y-3 shrink-0">
            {/* Cliente */}
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Cliente (opcional)"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="px-3 py-1.5 text-xs border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none text-[#1B2A4A]"
              />
              <input
                type="text"
                placeholder="RUC / DNI"
                value={clienteDocumento}
                onChange={(e) => setClienteDocumento(e.target.value)}
                className="px-3 py-1.5 text-xs border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none font-mono text-[#1B2A4A]"
              />
            </div>

            {/* Método de pago y Descuento */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Medio de Pago
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                  className="w-full px-2.5 py-1.5 text-xs font-medium border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:outline-none bg-white text-[#1B2A4A]"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="yape_plin">Yape / Plin</option>
                  <option value="tarjeta">Tarjeta Débito/Crédito</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Descuento ({descuentoPct}%) · Máx {topeDescuento}%
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max={topeDescuento}
                    value={descuentoPct}
                    onChange={(e) => handleCambioDescuento(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-bold border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:outline-none tabular-nums text-[#1B2A4A]"
                  />
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCambioDescuento(5)}
                      className="px-2 py-1.5 text-[10px] font-bold rounded-lg border border-[#E6E3DC] bg-[#F9F8F5] hover:bg-[#F2F0EA] text-[#1B2A4A]"
                    >
                      5%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCambioDescuento(10)}
                      className="px-2 py-1.5 text-[10px] font-bold rounded-lg border border-[#E6E3DC] bg-[#F9F8F5] hover:bg-[#F2F0EA] text-[#1B2A4A]"
                    >
                      10%
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Desglose Contable */}
            <div className="bg-[#F9F8F5] p-3.5 rounded-xl border border-[#E6E3DC] space-y-1 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal bruto:</span>
                <span className="tabular-nums font-semibold">{formatearMoneda(subtotalBruto)}</span>
              </div>
              {descuentoPct > 0 && (
                <div className="flex justify-between text-[#15803D] font-semibold">
                  <span>Descuento aplicado ({descuentoPct}%):</span>
                  <span className="tabular-nums">- {formatearMoneda(montoDescuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Base imponible:</span>
                <span className="tabular-nums font-semibold">{formatearMoneda(baseImponible)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>IGV (18%):</span>
                <span className="tabular-nums font-semibold">{formatearMoneda(montoIgv)}</span>
              </div>
              <div className="flex justify-between items-baseline text-sm font-extrabold text-[#1B2A4A] pt-2 border-t border-[#E6E3DC]">
                <span>TOTAL A PAGAR:</span>
                <span className="text-lg font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">
                  {formatearMoneda(totalEstimado)}
                </span>
              </div>
            </div>

            {/* Botón Principal de Confirmación en Terracota #D95D39 */}
            <button
              onClick={handleConfirmarVenta}
              disabled={carrito.length === 0 || ventaMutation.isPending}
              className="w-full py-3.5 px-4 rounded-xl bg-[#D95D39] hover:bg-[#C24D2B] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
            >
              {ventaMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando venta en almacén...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirmar e Imprimir Venta</span>
                  <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-black/20 rounded text-white font-semibold">
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
