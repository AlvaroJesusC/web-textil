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
  Scissors,
} from 'lucide-react'

interface ItemCarrito {
  producto: Producto
  cantidad: number
}

const OPCIONES_PAGO: { valor: MetodoPago; etiqueta: string }[] = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'yape_plin', etiqueta: 'Yape / Plin' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta POS' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
]

export const RegistrarVentaPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()
  const buscadorInputRef = useRef<HTMLInputElement>(null)

  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined)

  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [descuentoPct, setDescuentoPct] = useState<number>(0)
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteDocumento, setClienteDocumento] = useState('')

  const [errorVenta, setErrorVenta] = useState<string | null>(null)
  const [ventaConfirmada, setVentaConfirmada] = useState<Venta | null>(null)
  const [modalComprobanteAbierto, setModalComprobanteAbierto] = useState(false)

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategoriasApi,
  })

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

  const quitarDelCarrito = (productoId: number) => {
    setCarrito((actual) => actual.filter((item) => item.producto.id !== productoId))
  }

  const limpiarCarrito = () => {
    setCarrito([])
    setErrorVenta(null)
    setDescuentoPct(0)
    setClienteNombre('')
    setClienteDocumento('')
  }

  const subtotalBruto = carrito.reduce(
    (acc, item) => acc + item.cantidad * parseFloat(item.producto.precio),
    0
  )
  const montoDescuento = subtotalBruto * (descuentoPct / 100)
  const baseImponible = subtotalBruto - montoDescuento
  const montoIgv = baseImponible * 0.18
  const totalEstimado = baseImponible + montoIgv
  const totalUnidadesDespacho = carrito.reduce((acc, item) => acc + item.cantidad, 0)

  const handleNuevaVenta = () => {
    limpiarCarrito()
    setModalComprobanteAbierto(false)
    setVentaConfirmada(null)
    buscadorInputRef.current?.focus()
  }

  const productos = productosData?.items || []
  const mapaCarrito = new Map(carrito.map((i) => [i.producto.id, i.cantidad]))

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <Header
        titulo="Caja y Mesa de Corte (POS)"
        subtitulo="Despacho de mostrador por metraje, conos y avíos con liquidación exacta de IGV 18%"
      />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Columna Izquierda: Catálogo de Mostrador */}
        <section className="flex-1 flex flex-col min-h-0 border-r border-[#E5E0D5] overflow-hidden">
          <div className="p-4 border-b border-[#E5E0D5] bg-white space-y-3 shrink-0 shadow-[0_1px_3px_rgba(27,42,74,0.03)]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#2452E8]" />
              <input
                ref={buscadorInputRef}
                type="text"
                placeholder="Buscar tela, hilado o avío por código SKU o nombre... (Tecla '/')"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-12 py-2 text-xs rounded-xl input-textil font-medium"
              />
              <kbd className="absolute right-3 top-2 px-1.5 py-0.5 text-[10px] font-mono bg-white border border-[#DDD8CC] rounded-md text-[#1B2A4A] font-bold shadow-2xs">
                /
              </kbd>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 text-xs">
              <button
                onClick={() => setCategoriaId(undefined)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  categoriaId === undefined
                    ? 'btn-indigo'
                    : 'btn-superficie text-slate-600 hover:text-[#1B2A4A]'
                }`}
              >
                Todo el catálogo
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaId(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    categoriaId === cat.id
                      ? 'btn-indigo'
                      : 'btn-superficie text-slate-600 hover:text-[#1B2A4A]'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Grilla de Artículos Textiles con Micro-interacciones */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {cargandoProductos ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#2452E8]" />
                <span className="text-xs font-semibold text-[#1B2A4A]">
                  Cargando muestrario textil...
                </span>
              </div>
            ) : productos.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <p className="text-xs font-medium">
                  No se encontraron productos disponibles con ese criterio.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {productos.map((prod) => {
                  const agotado = prod.stock_actual <= 0
                  const cantEnOrden = mapaCarrito.get(prod.id) || 0
                  const stockCritico = !agotado && prod.stock_actual <= prod.stock_minimo

                  return (
                    <div
                      key={prod.id}
                      onClick={() => !agotado && agregarAlCarrito(prod)}
                      className={`group p-4 rounded-2xl text-left flex flex-col justify-between select-none ${
                        agotado
                          ? 'border border-[#E5E0D5] bg-white/50 opacity-50 cursor-not-allowed'
                          : cantEnOrden > 0
                            ? 'card-interactiva !border-[#2452E8] ring-2 ring-[#2452E8]/20 bg-gradient-to-b from-[#2452E8]/[0.04] to-white'
                            : 'card-interactiva'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md transition-colors ${
                              cantEnOrden > 0
                                ? 'bg-[#1B2A4A] text-white'
                                : 'bg-[#F2F0EA] text-[#1B2A4A] group-hover:bg-[#1B2A4A] group-hover:text-white'
                            }`}
                          >
                            {prod.sku}
                          </span>
                          {cantEnOrden > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full btn-cobalto tabular-nums">
                              En ticket: {cantEnOrden} {prod.unidad}
                              {cantEnOrden > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span
                              className={`text-[11px] font-bold tabular-nums ${
                                agotado
                                  ? 'text-[#B91C1C]'
                                  : stockCritico
                                    ? 'text-[#B45309]'
                                    : 'text-[#15803D]'
                              }`}
                            >
                              {agotado ? 'Sin stock' : `${prod.stock_actual} ${prod.unidad}s disp.`}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-[#1B2A4A] group-hover:text-[#2452E8] transition-colors line-clamp-2 leading-snug">
                          {prod.nombre}
                        </h4>
                        {prod.descripcion && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {prod.descripcion}
                          </p>
                        )}
                      </div>

                      <div className="mt-3.5 pt-2.5 border-t border-[#E5E0D5]/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium group-hover:text-[#D95D39] transition-colors">
                          {agotado ? `Por ${prod.unidad}` : `+ Añadir ${prod.unidad}`}
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

        {/* Columna Derecha: Orden de Despacho y Liquidación */}
        <section className="w-full lg:w-[420px] xl:w-[450px] bg-white flex flex-col min-h-0 border-t lg:border-t-0 overflow-hidden shrink-0 shadow-[-4px_0_24px_rgba(27,42,74,0.06)]">
          {/* Cabecera del Ticket con Trama Índigo */}
          <div className="px-5 py-3.5 sidebar-textil text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#E56A46] to-[#CF4F2B] border border-white/20 flex items-center justify-center shadow-sm">
                <Scissors className="w-4 h-4 text-white -rotate-45" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-white leading-tight">
                  Orden de Corte y Cobro
                </h3>
                <p className="text-[11px] text-slate-300 tabular-nums">
                  {carrito.length} {carrito.length === 1 ? 'artículo' : 'artículos'} ·{' '}
                  {totalUnidadesDespacho} uds/metros
                </p>
              </div>
            </div>
            {carrito.length > 0 && (
              <button
                onClick={limpiarCarrito}
                className="px-2.5 py-1 rounded-lg bg-white/8 hover:bg-rose-500/30 border border-white/10 hover:border-rose-400/40 text-xs text-rose-200 hover:text-white font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar</span>
              </button>
            )}
          </div>

          {errorVenta && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-[#FEE2E2] border border-[#DC2626]/20 text-[#B91C1C] text-xs font-medium flex items-start gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626] mt-0.5" />
              <span>{errorVenta}</span>
            </div>
          )}

          {/* Lista de Ítems en la Orden */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2.5 bg-[#F9F8F5]">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2.5 py-6">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E0D5] shadow-xs flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-[#D95D39]" />
                </div>
                <p className="text-xs font-bold text-[#1B2A4A]">Orden de despacho vacía</p>
                <p className="text-[11px] text-slate-500 text-center max-w-[230px]">
                  Haga clic en cualquier tela o insumo del muestrario izquierdo para añadirlo al corte.
                </p>
              </div>
            ) : (
              carrito.map((item) => {
                const subtotalItem = item.cantidad * parseFloat(item.producto.precio)
                return (
                  <div
                    key={item.producto.id}
                    className="p-3.5 card-textil rounded-xl space-y-2 hover:border-[#2452E8]/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-[#2452E8] font-bold">
                            {item.producto.sku}
                          </span>
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            {formatearMoneda(item.producto.precio)} / {item.producto.unidad}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1B2A4A] truncate mt-0.5">
                          {item.producto.nombre}
                        </p>
                      </div>
                      <button
                        onClick={() => quitarDelCarrito(item.producto.id)}
                        className="text-slate-400 hover:text-[#DC2626] p-1 rounded-lg hover:bg-[#FEE2E2]/60 transition-colors cursor-pointer"
                        title="Quitar artículo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E0D5]/70">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-[#DDD8CC] rounded-xl overflow-hidden bg-[#FAF9F6] shadow-2xs">
                          <button
                            onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                            className="px-2.5 py-1 text-[#1B2A4A] hover:bg-[#E5E0D5] active:scale-95 transition-all cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.producto.stock_actual}
                            value={item.cantidad}
                            onChange={(e) =>
                              actualizarCantidad(
                                item.producto.id,
                                parseInt(e.target.value, 10) || 1
                              )
                            }
                            className="w-12 text-center text-xs font-bold bg-white py-1 text-[#1B2A4A] focus:outline-none tabular-nums"
                          />
                          <button
                            onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                            className="px-2.5 py-1 text-[#1B2A4A] hover:bg-[#E5E0D5] active:scale-95 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500">
                          {item.producto.unidad}s
                        </span>
                      </div>

                      <span className="text-xs font-extrabold text-[#1B2A4A] tabular-nums">
                        {formatearMoneda(subtotalItem)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Panel de Cliente, Modalidad de Pago y Liquidación Contable */}
          <div className="p-4 bg-white border-t border-[#E5E0D5] space-y-3 shrink-0">
            {/* Datos de Cliente */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Cliente o taller (opcional)"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl input-textil"
              />
              <input
                type="text"
                placeholder="RUC o DNI"
                value={clienteDocumento}
                onChange={(e) => setClienteDocumento(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl input-textil font-mono"
              />
            </div>

            {/* Botonera Directa de Medio de Pago con Relieve */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#1B2A4A]">Modalidad de cobro</span>
                <span className="text-[11px] text-slate-500">
                  Descuento máx. {topeDescuento}%
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {OPCIONES_PAGO.map((op) => (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => setMetodoPago(op.valor)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold truncate ${
                      metodoPago === op.valor
                        ? 'btn-indigo'
                        : 'btn-superficie text-slate-600 hover:text-[#1B2A4A]'
                    }`}
                  >
                    {op.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            {/* Control de Descuento Comercial */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                Descuento comercial (%):
              </span>
              <div className="flex items-center gap-1.5">
                {[0, 5, 10].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleCambioDescuento(pct)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                      descuentoPct === pct
                        ? 'btn-cobalto'
                        : 'btn-superficie'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
                <input
                  type="number"
                  min="0"
                  max={topeDescuento}
                  value={descuentoPct}
                  onChange={(e) => handleCambioDescuento(parseFloat(e.target.value))}
                  aria-label="Porcentaje de descuento"
                  className="w-14 px-2 py-1 text-xs font-bold text-center rounded-lg input-textil tabular-nums"
                />
              </div>
            </div>

            {/* Desglose Contable con IGV 18% */}
            <div className="bg-gradient-to-b from-[#FAF9F6] to-[#F2F0EA] p-3.5 rounded-xl border border-[#E5E0D5] space-y-1 text-xs shadow-inner">
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
                <span>Valor venta (Base imponible):</span>
                <span className="tabular-nums font-semibold">{formatearMoneda(baseImponible)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>IGV (18%):</span>
                <span className="tabular-nums font-semibold">{formatearMoneda(montoIgv)}</span>
              </div>
              <div className="flex justify-between items-baseline text-sm font-extrabold text-[#1B2A4A] pt-2 border-t border-[#DDD8CC]">
                <span>Importe Total a Cobrar:</span>
                <span className="text-lg font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">
                  {formatearMoneda(totalEstimado)}
                </span>
              </div>
            </div>

            {/* Botón Principal de Confirmación con Relieve Terracota */}
            <button
              onClick={handleConfirmarVenta}
              disabled={carrito.length === 0 || ventaMutation.isPending}
              className="w-full py-3.5 px-4 rounded-xl btn-terracota font-bold text-sm flex items-center justify-center gap-2"
            >
              {ventaMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Descargando stock y emitiendo...</span>
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

      <ComprobanteModal
        abierto={modalComprobanteAbierto}
        venta={ventaConfirmada}
        alCerrar={() => setModalComprobanteAbierto(false)}
        alNuevaVenta={handleNuevaVenta}
      />
    </div>
  )
}
