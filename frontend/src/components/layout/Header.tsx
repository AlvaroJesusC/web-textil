import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, Scale, Calendar } from 'lucide-react'
import { useAuth } from '@/features/auth'

interface HeaderProps {
  titulo?: string
  subtitulo?: string
}

const TITULOS_PESTANA: Record<string, string> = {
  '/': 'Resumen de Tienda · Textilería Lima',
  '/inventario': 'Catálogo e Inventario · Textilería Lima',
  '/ventas/nueva': 'Caja y Corte POS · Textilería Lima',
  '/ventas': 'Libro de Ventas · Textilería Lima',
  '/conciliacion': 'Auditoría Física · Textilería Lima',
  '/reportes': 'Métricas Comerciales · Textilería Lima',
}

const FECHA_CORTA = new Date().toLocaleDateString('es-PE', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export const Header: React.FC<HeaderProps> = ({ titulo, subtitulo }) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { tieneRol } = useAuth()

  useEffect(() => {
    document.title = TITULOS_PESTANA[pathname] || `${titulo || 'Sistema'} · Textilería Lima`
  }, [pathname, titulo])

  const enPos = pathname === '/ventas/nueva'
  const enConciliacion = pathname === '/conciliacion'
  const puedeVender = tieneRol('administrador', 'vendedor')
  const puedeAuditar = tieneRol('administrador', 'almacenero')

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#E5E0D5] px-6 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-[0_1px_3px_rgba(27,42,74,0.03)]">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-extrabold text-[#1B2A4A] tracking-tight leading-tight truncate">
            {titulo || 'Sistema Textil'}
          </h2>
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F2F0EA] border border-[#E5E0D5] text-[11px] font-semibold text-slate-600">
            <Calendar className="w-3 h-3 text-[#D95D39]" />
            <span>{FECHA_CORTA}</span>
          </span>
        </div>
        {subtitulo && (
          <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">{subtitulo}</p>
        )}
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {pathname === '/' && puedeAuditar && !enConciliacion && (
          <button
            onClick={() => navigate('/conciliacion')}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl btn-indigo text-xs font-bold"
          >
            <Scale className="w-3.5 h-3.5 text-[#FFD0C2]" />
            <span>Conteo Físico</span>
          </button>
        )}

        {(pathname === '/' || pathname === '/ventas') && puedeVender && !enPos && (
          <button
            onClick={() => navigate('/ventas/nueva')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-terracota text-xs font-bold"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Venta (POS)</span>
          </button>
        )}
      </div>
    </header>
  )
}
