import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  Receipt,
  ArrowRight,
  Clock,
  Sparkles,
  Scale,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/features/auth'
import { listarProductosApi } from '@/features/inventario/api'
import { listarVentasApi } from '@/features/ventas/api'
import { formatearMoneda, formatearFecha } from '@/lib/formato'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { usuario, tieneRol } = useAuth()

  // Consultar productos para métricas
  const { data: productosData, isLoading: cargandoProductos } = useQuery({
    queryKey: ['productos-dashboard'],
    queryFn: () => listarProductosApi({ limit: 100 }),
  })

  // Consultar ventas recientes
  const { data: ventasData, isLoading: cargandoVentas } = useQuery({
    queryKey: ['ventas-dashboard'],
    queryFn: () => listarVentasApi({ limit: 5 }),
    enabled: tieneRol('administrador', 'vendedor', 'gerente'),
  })

  const productos = productosData?.items || []
  const productosBajoStock = productos.filter((p) => p.estado_stock === 'bajo' || p.estado_stock === 'agotado')
  const productosActivos = productos.filter((p) => p.estado === 'activo')

  const ventas = ventasData?.items || []
  const totalVentasMonto = ventas.reduce((acc, v) => acc + parseFloat(v.total || '0'), 0)

  return (
    <div className="flex-1 flex flex-col">
      <Header
        titulo="Panel de Control"
        subtitulo={`Bienvenido, ${usuario?.nombre}. Sistema de Gestión Textil.`}
      />

      <main className="p-6 space-y-6">
        {/* Banner de Acción Rápida para Mostrador */}
        {tieneRol('administrador', 'vendedor') && (
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-700/50">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-700 text-blue-100 mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Punto de Venta en Mostrador
              </div>
              <h3 className="text-xl font-bold">Caja Rápida Textil (POS)</h3>
              <p className="text-sm text-blue-200 mt-1 max-w-xl">
                Registro acelerado de ventas con atajos de teclado, cálculo exacto de IGV (18%) y descuento de stock en línea.
              </p>
            </div>
            <button
              onClick={() => navigate('/ventas/nueva')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-950 font-bold text-sm shadow-md hover:bg-blue-50 transition-colors shrink-0"
            >
              <ShoppingCart className="w-4 h-4 text-blue-800" />
              <span>Abrir Caja de Ventas</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}

        {/* Tarjetas de Indicadores Clave (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tarjeta 1: Total ventas recientes */}
          {tieneRol('administrador', 'vendedor', 'gerente') && (
            <div
              onClick={() => navigate(tieneRol('administrador', 'gerente') ? '/reportes' : '/ventas')}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-emerald-300 transition-colors group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-emerald-800 transition-colors">
                  Ventas Recientes
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">
                {cargandoVentas ? '...' : formatearMoneda(totalVentasMonto)}
              </div>
              <p className="text-xs text-emerald-700 flex items-center gap-1 mt-1 font-medium">
                <span>{tieneRol('administrador', 'gerente') ? 'Ver reportes analíticos' : 'Ver historial'}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          )}

          {/* Tarjeta 2: Productos Activos */}
          <div
            onClick={() => navigate('/inventario')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-blue-300 transition-colors group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-blue-800 transition-colors">
                Catálogo Textil
              </span>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {cargandoProductos ? '...' : productosActivos.length}
            </div>
            <p className="text-xs text-blue-700 flex items-center gap-1 mt-1 font-medium">
              <span>Gestionar telas y avíos</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>

          {/* Tarjeta 3: Alertas de Stock */}
          <div
            onClick={() => navigate('/inventario')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-300 transition-colors group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-amber-800 transition-colors">
                Stock Crítico
              </span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-900 tabular-nums">
              {cargandoProductos ? '...' : productosBajoStock.length}
            </div>
            <p className="text-xs text-amber-700 flex items-center gap-1 mt-1 font-medium">
              <span>Ver productos por reponer</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>

          {/* Tarjeta 4: Conciliación / Semáforo de Calidad */}
          <div
            onClick={() => navigate('/conciliacion')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-blue-300 transition-colors group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-blue-800 transition-colors">
                Control de Stock
              </span>
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Semáforo ≤ 2%</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Tolerancia
              </span>
            </div>
            <p className="text-xs text-blue-700 flex items-center gap-1 mt-1 font-medium">
              <span>Conteo físico de almacén</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </p>
          </div>
        </div>

        {/* Sección de dos columnas: Ventas Recientes y Alertas de Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna 1: Últimas Ventas */}
          {tieneRol('administrador', 'vendedor', 'gerente') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  <h4 className="font-bold text-sm text-slate-900">Últimas Ventas Emitidas</h4>
                </div>
                <button
                  onClick={() => navigate('/ventas')}
                  className="text-xs text-blue-800 hover:text-blue-900 font-semibold flex items-center gap-1"
                >
                  <span>Ver todas</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {ventas.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No hay ventas registradas aún.
                  </div>
                ) : (
                  ventas.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => navigate('/ventas')}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-900">{v.numero}</span>
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                            {v.metodo_pago}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatearFecha(v.fecha)}</span>
                          {v.cliente_nombre && <span>· {v.cliente_nombre}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900 tabular-nums">
                          {formatearMoneda(v.total)}
                        </div>
                        <span className="text-[11px] text-emerald-700 font-medium">Completada</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Columna 2: Resumen de Stock Crítico */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <h4 className="font-bold text-sm text-slate-900">Productos con Stock Mínimo o Agotado</h4>
              </div>
              <button
                onClick={() => navigate('/inventario')}
                className="text-xs text-blue-800 hover:text-blue-900 font-semibold flex items-center gap-1"
              >
                <span>Ir al catálogo</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {productosBajoStock.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Todos los productos cuentan con stock suficiente.
                </div>
              ) : (
                productosBajoStock.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate('/inventario')}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-slate-500">{p.sku}</span>
                        <span className="text-xs font-bold text-slate-900">{p.nombre}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Mínimo: {p.stock_minimo} {p.unidad}(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-900 tabular-nums">
                        {p.stock_actual} {p.unidad}(s)
                      </div>
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          p.stock_actual === 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.stock_actual === 0 ? 'Agotado' : 'Bajo'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
