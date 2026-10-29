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
    {
      to: '/conciliacion',
      label: 'Conciliación de Stock',
      icon: Scale,
      mostrar: tieneRol('administrador', 'almacenero', 'gerente'),
      badge: '2%',
    },
    {
      to: '/reportes',
      label: 'Reportes y Métricas',
      icon: BarChart3,
      mostrar: tieneRol('administrador', 'gerente'),
    },
  ]

  const rolEtiqueta: Record<string, string> = {
    administrador: 'Administrador',
    vendedor: 'Vendedor Mostrador',
    almacenero: 'Almacenero',
    gerente: 'Gerente General',
  }

  return (
    <aside className="w-64 bg-[#1B2A4A] text-white flex flex-col border-r border-white/10 select-none h-full shrink-0 shadow-md">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-[#D95D39] flex items-center justify-center text-white shadow-sm shrink-0">
          <Scissors className="w-5 h-5 -rotate-45 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-extrabold tracking-tight text-white truncate">
            Textilería Lima
          </h1>
          <p className="text-[11px] text-slate-300 truncate font-medium">
            Ventas e Inventario Textil
          </p>
        </div>
      </div>

      {/* Operador / Usuario Conectado */}
      <div className="p-3.5 mx-3 my-3 rounded-xl bg-white/8 border border-white/12 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-white truncate">
            {usuario?.nombre || 'Operador'}
          </span>
          <span
            className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-xs"
            title="En línea"
          ></span>
        </div>
        <div className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-[#D95D39]/20 text-[#FFD0C2] border border-[#D95D39]/40">
          {usuario ? rolEtiqueta[usuario.rol] || usuario.rol : 'Cargando...'}
        </div>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold tracking-wider text-slate-300/70 uppercase">
          Módulos Operativos
        </div>
        {navItems
          .filter((item) => item.mostrar)
          .map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-white/12 text-white font-bold border-l-4 border-[#D95D39] shadow-xs'
                      : 'text-slate-300 hover:bg-white/6 hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-[#D95D39]' : 'text-slate-300'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors',
                          item.badge === 'POS'
                            ? 'bg-[#D95D39] text-white'
                            : 'bg-white/15 text-white border border-white/20'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
      </nav>

      {/* Pie de Barra Lateral */}
      <div className="p-3.5 border-t border-white/10 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between px-2 text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>API Conectada</span>
          </span>
          <span className="font-mono text-[10px] text-slate-400">v1.0</span>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-200 hover:text-white hover:bg-rose-500/20 rounded-lg border border-rose-400/25 transition-all duration-150"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
