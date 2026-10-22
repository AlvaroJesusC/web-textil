import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Search, Sparkles } from 'lucide-react'
import { useAuth } from '@/features/auth'

interface HeaderProps {
  titulo?: string
  subtitulo?: string
}

export const Header: React.FC<HeaderProps> = ({ titulo, subtitulo }) => {
  const navigate = useNavigate()
  const { tieneRol } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shrink-0">
      <div>
        <h2 className="text-lg font-bold text-slate-900 leading-tight">
          {titulo || 'Sistema Textil'}
        </h2>
        {subtitulo && <p className="text-xs text-slate-500">{subtitulo}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Atajo rápido para buscar */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 text-xs text-slate-600 border border-slate-200">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Atajo buscar:</span>
          <kbd className="px-1 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-300 shadow-2xs font-semibold">
            /
          </kbd>
        </div>

        {/* Botón rápido nueva venta */}
        {tieneRol('administrador', 'vendedor') && (
          <button
            onClick={() => navigate('/ventas/nueva')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Venta</span>
          </button>
        )}

        <div className="hidden lg:flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Precios en S/ (IGV 18%)</span>
        </div>
      </div>
    </header>
  )
}
