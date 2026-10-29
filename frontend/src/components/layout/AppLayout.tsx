import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/features/auth'
import type { RolUsuario } from '@/types'
import { Loader2 } from 'lucide-react'

export const RutaPorRol: React.FC<{ roles: RolUsuario[]; children: React.ReactNode }> = ({
  roles,
  children,
}) => {
  const { tieneRol } = useAuth()
  if (!tieneRol(...roles)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export const AppLayout: React.FC = () => {
  const { estaAutenticado, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F8F5] gap-3 font-sans">
        <Loader2 className="w-8 h-8 text-[#D95D39] animate-spin" />
        <p className="text-xs font-bold text-[#1B2A4A] tracking-wide uppercase">
          Cargando Sistema Textil...
        </p>
      </div>
    )
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen bg-[#F9F8F5] text-[#1B2A4A] overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
