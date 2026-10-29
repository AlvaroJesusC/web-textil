import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '@/features/auth'

interface HeaderProps {
  titulo?: string
  subtitulo?: string
}

const TITULOS_PESTANA: Record<string, string> = {
  '/': 'Dashboard · Textilería',
  '/inventario': 'Inventario · Textilería',
  '/ventas/nueva': 'Caja POS · Textilería',
  '/ventas': 'Ventas · Textilería',
  '/conciliacion': 'Conciliación · Textilería',
  '/reportes': 'Reportes · Textilería',
}

export const Header: React.FC<HeaderProps> = ({ titulo, subtitulo }) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { tieneRol } = useAuth()

  useEffect(() => {
    document.title = TITULOS_PESTANA[pathname] || `${titulo || 'Sistema'} · Textilería`
  }, [pathname, titulo])

  // Mostrar el botón "+ Nueva Venta" solo en el Historial de Ventas (/ventas),
  // evitando duplicarlo en el Dashboard, en la propia Caja POS o competir con botones de Almacén.
  const mostrarBotonNuevaVenta =
    pathname === '/ventas' && tieneRol('administrador', 'vendedor')

  return (
    <header className="h-16 bg-white border-b border-[#E6E3DC] px-6 flex items-center justify-between sticky top-0 z-10 shrink-0 shadow-2xs">
      <div className="min-w-0">
        <h2 className="text-base font-extrabold text-[#1B2A4A] tracking-tight leading-tight truncate">
          {titulo || 'Sistema Textil'}
        </h2>
        {subtitulo && (
          <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">{subtitulo}</p>
        )}
      </div>

      {mostrarBotonNuevaVenta && (
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/ventas/nueva')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D95D39] hover:bg-[#C24D2B] text-white text-xs font-bold shadow-sm transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva Venta</span>
          </button>
        </div>
      )}
    </header>
  )
}
