import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  Receipt,
  Clock,
  Scale,
  Plus,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/features/auth'
import { listarProductosApi } from '@/features/inventario/api'
import { listarVentasApi } from '@/features/ventas/api'
import { formatearMoneda, formatearFecha } from '@/lib/formato'

const FECHA_HOY = new Date().toLocaleDateString('es-PE', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

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
    queryFn: () => listarVentasApi({ limit: 6 }),
    enabled: tieneRol('administrador', 'vendedor', 'gerente'),
  })

  const productos = productosData?.items || []
  const productosBajoStock = productos.filter(
    (p) => p.estado_stock === 'bajo' || p.estado_stock === 'agotado'
  )
  const productosAgotados = productos.filter((p) => p.estado_stock === 'agotado')
  const productosActivos = productos.filter((p) => p.estado === 'activo')

  const ventas = ventasData?.items || []
  const ventasValidas = ventas.filter((v) => v.estado !== 'anulada')
  const totalVentasMonto = ventasValidas.reduce((acc, v) => acc + parseFloat(v.total || '0'), 0)
  const puedeVerConciliacion = tieneRol('administrador', 'almacenero', 'gerente')

  return (
    <div className="flex-1 flex flex-col bg-[#F9F8F5]">
      <Header
        titulo="Panel de Control Operativo"
        subtitulo="Visión consolidada de ventas en mostrador y disponibilidad de inventario textil"
      />

      <main className="p-6 space-y-6">
        {/* Barra de Mostrador Activo con presencia e identidad textil */}
        <div className="rounded-xl bg-white border border-[#E6E3DC] border-l-4 border-l-[#D95D39] p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-extrabold text-[#1B2A4A] tracking-tight">
                  Mostrador y Caja Activa
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#DCFCE7] text-[#15803D]">
                  Caja Abierta
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Operador en turno:{' '}
                <span className="font-bold text-[#1B2A4A]">{usuario?.nombre}</span> · Fecha:{' '}
                <span className="capitalize font-medium">{FECHA_HOY}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto shrink-0">
            {tieneRol('administrador', 'vendedor') && (
              <button
                onClick={() => navigate('/ventas/nueva')}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#D95D39] hover:bg-[#C24D2B] text-white text-xs font-bold shadow-sm transition-all duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Registrar Venta (POS)</span>
              </button>
            )}
            {tieneRol('administrador', 'almacenero') && (
              <button
                onClick={() => navigate('/conciliacion')}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1B2A4A] hover:bg-[#243861] text-white text-xs font-bold shadow-sm transition-all duration-150 cursor-pointer"
              >
                <Scale className="w-4 h-4" />
                <span>Conteo Físico</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Tarjetas KPI con Iconografía Coloreada y Tipografía Plus Jakarta Sans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Tarjeta 1: Ventas Recientes (o Agotados para Almacenero) */}
          {tieneRol('administrador', 'vendedor', 'gerente') ? (
            <div
              onClick={() => navigate(tieneRol('administrador', 'gerente') ? '/reportes' : '/ventas')}
              className="rounded-xl bg-white p-5 border border-[#E6E3DC] shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ventas Recientes
                </span>
                <div className="w-9 h-9 rounded-lg bg-[#2452E8]/10 text-[#2452E8] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">
                {cargandoVentas ? '...' : formatearMoneda(totalVentasMonto)}
              </div>
              <p className="text-xs text-[#2452E8] hover:underline mt-2 font-semibold">
                {tieneRol('administrador', 'gerente') ? 'Ver reportes analíticos' : 'Ver historial de tickets'}
              </p>
            </div>
          ) : (
            <div
              onClick={() => navigate('/inventario?estado_stock=agotado')}
              className="rounded-xl bg-white p-5 border border-[#E6E3DC] shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Artículos Agotados
                </span>
                <div className="w-9 h-9 rounded-lg bg-[#2452E8]/10 text-[#2452E8] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">
                {cargandoProductos ? '...' : `${productosAgotados.length} artículos`}
              </div>
              <p className="text-xs text-[#2452E8] hover:underline mt-2 font-semibold">
                Filtrar agotados en almacén
              </p>
            </div>
          )}

          {/* Tarjeta 2: Catálogo Activo */}
          <div
            onClick={() => navigate('/inventario')}
            className="rounded-xl bg-white p-5 border border-[#E6E3DC] shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Catálogo Activo
              </span>
              <div className="w-9 h-9 rounded-lg bg-[#1B2A4A]/10 text-[#1B2A4A] flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">
              {cargandoProductos ? '...' : `${productosActivos.length} artículos`}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Telas, conos y avíos habilitados
            </p>
          </div>

          {/* Tarjeta 3: Stock Crítico */}
          <div
            onClick={() => navigate('/inventario?estado_stock=bajo')}
            className="rounded-xl bg-white p-5 border border-[#E6E3DC] shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Stock Crítico
              </span>
              <div className="w-9 h-9 rounded-lg bg-[#D95D39]/12 text-[#D95D39] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">
              {cargandoProductos ? '...' : `${productosBajoStock.length} artículos`}
            </div>
            <p className="text-xs text-[#D95D39] mt-2 font-semibold">
              {productosBajoStock.length > 0 ? 'Ver stock bajo en inventario' : 'Sin desabastecimiento'}
            </p>
          </div>

          {/* Tarjeta 4: Auditoría Física */}
          <div
            onClick={() => navigate(puedeVerConciliacion ? '/conciliacion' : '/inventario')}
            className="rounded-xl bg-white p-5 border border-[#E6E3DC] shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Auditoría Física
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">
                ≤ 2.0%
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#15803D]">
                Tolerancia
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Control de merma y faltantes
            </p>
          </div>
        </div>

        {/* Sección de dos paneles inferiores con rounded-xl y cabeceras claras */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna 1: Últimas Ventas Emitidas */}
          {tieneRol('administrador', 'vendedor', 'gerente') && (
            <div className="rounded-xl bg-white border border-[#E6E3DC] shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#E6E3DC] bg-[#F2F0EA]/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#1B2A4A]" />
                  <h4 className="font-bold text-xs text-[#1B2A4A] uppercase tracking-wider">
                    Últimas Ventas Emitidas
                  </h4>
                </div>
                <button
                  onClick={() => navigate('/ventas')}
                  className="text-xs text-[#2452E8] hover:underline font-semibold cursor-pointer"
                >
                  Ver historial
                </button>
              </div>

              <div className="divide-y divide-[#E6E3DC]/60">
                {ventas.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No se registran ventas en la sesión actual.
                  </div>
                ) : (
                  ventas.map((v) => {
                    const esAnulada = v.estado === 'anulada'
                    return (
                      <div
                        key={v.id}
                        onClick={() => navigate(`/ventas?venta_id=${v.id}`)}
                        className="px-5 py-3 flex items-center justify-between hover:bg-[#F9F8F5] cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#1B2A4A]">{v.numero}</span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#F2F0EA] text-[#1B2A4A] capitalize">
                              {v.metodo_pago.replace('_', ' / ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 truncate">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{formatearFecha(v.fecha)}</span>
                            {v.cliente_nombre && <span>· {v.cliente_nombre}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div
                            className={`text-sm font-bold tabular-nums ${
                              esAnulada ? 'line-through text-slate-400' : 'text-[#1B2A4A]'
                            }`}
                          >
                            {formatearMoneda(v.total)}
                          </div>
                          {esAnulada ? (
                            <span className="text-[11px] text-[#B91C1C] font-semibold">Anulada</span>
                          ) : (
                            <span className="text-[11px] text-[#15803D] font-semibold">Emitida</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* Columna 2: Productos con Stock Crítico */}
          <div className="rounded-xl bg-white border border-[#E6E3DC] shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E6E3DC] bg-[#F2F0EA]/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D95D39]" />
                <h4 className="font-bold text-xs text-[#1B2A4A] uppercase tracking-wider">
                  Productos con Stock Crítico
                </h4>
              </div>
              <button
                onClick={() => navigate('/inventario?estado_stock=bajo')}
                className="text-xs text-[#2452E8] hover:underline font-semibold cursor-pointer"
              >
                Ver inventario
              </button>
            </div>

            <div className="divide-y divide-[#E6E3DC]/60">
              {productosBajoStock.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Todos los productos cuentan con existencias sobre el umbral mínimo.
                </div>
              ) : (
                productosBajoStock.slice(0, 6).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/inventario?q=${encodeURIComponent(p.sku)}`)}
                    className="px-5 py-3 flex items-center justify-between hover:bg-[#F9F8F5] cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-[#1B2A4A] bg-[#F2F0EA] px-1.5 py-0.5 rounded">
                          {p.sku}
                        </span>
                        <span className="text-xs font-bold text-[#1B2A4A] truncate">{p.nombre}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Mínimo establecido: <span className="font-semibold tabular-nums">{p.stock_minimo}</span>{' '}
                        {p.unidad}(s)
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-[#1B2A4A] tabular-nums">
                        {p.stock_actual} {p.unidad}(s)
                      </div>
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${
                          p.stock_actual === 0
                            ? 'bg-[#FEE2E2] text-[#B91C1C]'
                            : 'bg-[#FEF3C7] text-[#B45309]'
                        }`}
                      >
                        {p.stock_actual === 0 ? 'Agotado' : 'Stock Bajo'}
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
