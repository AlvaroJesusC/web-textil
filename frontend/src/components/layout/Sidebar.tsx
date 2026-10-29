import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Scale,
  BarChart3,
  LogOut,
  Scissors,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/features/auth'
import { cn } from '@/lib/utils'

export const Sidebar: React.FC = () => {
  const { usuario, logout, tieneRol } = useAuth()

  const grupoMostrador = [
    {
      to: '/',
      label: 'Resumen de Tienda',
      icon: LayoutDashboard,
      mostrar: true,
    },
    {
      to: '/ventas/nueva',
      label: 'Caja y Corte (POS)',
      icon: ShoppingCart,
      mostrar: tieneRol('administrador', 'vendedor'),
    },
    {
      to: '/ventas',
      label: 'Libro de Ventas',
      icon: Receipt,
      mostrar: tieneRol('administrador', 'vendedor', 'gerente'),
    },
  ]

  const grupoAlmacen = [
    {
      to: '/inventario',
      label: 'Catálogo de Telas y Avíos',
      icon: Package,
      mostrar: true,
    },
    {
      to: '/conciliacion',
      label: 'Auditoría Física (2%)',
      icon: Scale,
      mostrar: tieneRol('administrador', 'almacenero', 'gerente'),
    },
    {
      to: '/reportes',
      label: 'Métricas y Rotación',
      icon: BarChart3,
      mostrar: tieneRol('administrador', 'gerente'),
    },
  ]

  const rolEtiqueta: Record<string, string> = {
    administrador: 'Administrador General',
    vendedor: 'Despacho y Mostrador',
    almacenero: 'Control de Almacén',
    gerente: 'Gerencia Comercial',
  }

  const iniciales = (usuario?.nombre || 'OP')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const renderItem = (item: { to: string; label: string; icon: React.ElementType }) => {
    const Icon = item.icon
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end
        className={({ isActive }) =>
          cn(
            'group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200',
            isActive
              ? 'bg-gradient-to-r from-[#D95D39]/25 via-white/12 to-white/5 text-white font-bold border-l-[3px] border-[#D95D39] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_2px_8px_rgba(0,0,0,0.18)]'
              : 'text-slate-300/90 hover:bg-white/8 hover:text-white hover:translate-x-1'
          )
        }
      >
        {({ isActive }) => (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200',
                  isActive
                    ? 'bg-[#D95D39] text-white shadow-[0_2px_8px_rgba(217,93,57,0.45)]'
                    : 'bg-white/5 text-slate-300 group-hover:bg-white/12 group-hover:text-white group-hover:scale-105'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">{item.label}</span>
            </div>
            <ChevronRight
              className={cn(
                'w-3.5 h-3.5 shrink-0 transition-all duration-200',
                isActive
                  ? 'text-[#D95D39] opacity-100 translate-x-0'
                  : 'text-slate-400 opacity-0 -translate-x-1 group-hover:opacity-70 group-hover:translate-x-0'
              )}
            />
          </>
        )}
      </NavLink>
    )
  }

  return (
    <aside className="w-64 sidebar-textil text-white flex flex-col border-r border-white/10 select-none h-full shrink-0 shadow-xl">
      {/* Cabecera de Marca con Relieve Cálido */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3.5 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#E56A46] to-[#CF4F2B] border border-white/20 flex items-center justify-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_12px_rgba(217,93,57,0.35)] shrink-0">
          <Scissors className="w-4 h-4 -rotate-45 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-extrabold tracking-tight text-white truncate">
            Textilería Lima
          </h1>
          <p className="text-[11px] text-slate-300/80 truncate">
            Sede Gamarra · ERP Textil
          </p>
        </div>
      </div>

      {/* Navegación Principal con Micro-interacciones */}
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 pb-2 text-[11px] font-semibold text-slate-400/90">
            Mostrador y Despacho
          </p>
          <div className="space-y-1.5">
            {grupoMostrador.filter((item) => item.mostrar).map(renderItem)}
          </div>
        </div>

        <div>
          <p className="px-3 pb-2 text-[11px] font-semibold text-slate-400/90">
            Almacén y Control
          </p>
          <div className="space-y-1.5">
            {grupoAlmacen.filter((item) => item.mostrar).map(renderItem)}
          </div>
        </div>
      </nav>

      {/* Ficha de Operador en Turno y Cierre de Sesión */}
      <div className="p-3.5 m-3 rounded-xl bg-white/6 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#2B4270] to-[#1B2A4A] border border-white/20 flex items-center justify-center text-xs font-extrabold text-white shadow-xs shrink-0">
              {iniciales}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {usuario?.nombre || 'Operador'}
              </p>
              <p className="text-[11px] text-[#FFD0C2]/90 truncate font-medium">
                {usuario ? rolEtiqueta[usuario.rol] || usuario.rol : 'Sesión activa'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="p-2 text-slate-300 hover:text-white hover:bg-rose-500/30 hover:border-rose-400/40 border border-transparent rounded-lg transition-all duration-150 shrink-0 cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
