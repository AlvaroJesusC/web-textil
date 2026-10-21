import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/features/auth'
import { Loader2 } from 'lucide-react'

export const AppLayout: React.FC = () => {
  const { estaAutenticado, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
        <p className="text-sm font-medium text-slate-600 font-mono">Cargando Sistema Textil...</p>
      </div>
    )
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
