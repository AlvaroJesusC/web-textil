import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  LogOut,
  Scissors,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/features/auth'
import { cn } from '@/lib/utils'

export const Sidebar: React.FC = () => {
  const { usuario, logout, tieneRol } = useAuth()

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      mostrar: true,
    },
    {
      to: '/inventario',
      label: 'Inventario de Telas',
      icon: Package,
      mostrar: true,
    },
    {
      to: '/ventas/nueva',
      label: 'Caja / Nueva Venta',
      icon: ShoppingCart,
      mostrar: tieneRol('administrador', 'vendedor'),
      badge: 'POS',
    },
    {
      to: '/ventas',
      label: 'Historial de Ventas',
      icon: Receipt,
      mostrar: tieneRol('administrador', 'vendedor', 'gerente'),
    },
  ]

  const rolEtiqueta: Record<string, string> = {
    administrador: 'Administrador',
    vendedor: 'Vendedor de Mostrador',
    almacenero: 'Almacenero',
    gerente: 'Gerente General',
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 select-none min-h-screen">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-sm ring-1 ring-white/20">
          <Scissors className="w-5 h-5 -rotate-45" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white uppercase font-mono">Textilería Lima</h1>
          <p className="text-xs text-slate-400">Ventas e Inventario</p>
        </div>
      </div>

      {/* Usuario Info */}
      <div className="p-3 mx-3 my-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-medium text-slate-200 truncate">{usuario?.nombre || 'Usuario'}</span>
        </div>
        <div className="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-900/60 text-blue-300 border border-blue-700/40">
          {usuario ? rolEtiqueta[usuario.rol] || usuario.rol : 'Cargando...'}
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 space-y-1">
        <div className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Módulos
        </div>
        {navItems
          .filter((item) => item.mostrar)
          .map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-800 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
      </nav>

      {/* Pie de Barra Lateral */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center justify-between px-2 py-1.5 text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> API Activa
          </span>
          <span className="text-[11px] font-mono text-slate-400">v1.0.0</span>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 rounded-lg border border-rose-900/30 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
