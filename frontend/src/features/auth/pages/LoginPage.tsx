import React, { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { Eye, EyeOff, Lock, User, Scissors, AlertCircle, Loader2 } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, estaAutenticado, cargando } = useAuth()

  useEffect(() => {
    document.title = 'Login · Textilería'
  }, [])

  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (estaAutenticado && !cargando) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!usuario.trim() || !contrasena.trim()) {
      setError('Por favor ingrese usuario y contraseña.')
      return
    }

    try {
      setEnviando(true)
      await login(usuario.trim(), contrasena)
      navigate('/')
    } catch (err: unknown) {
      const apiErr = err as { detalle?: string }
      setError(apiErr.detalle || 'Credenciales no autorizadas.')
    } finally {
      setEnviando(false)
    }
  }

  const rellenarCredencial = (usr: string, pass: string) => {
    setUsuario(usr)
    setContrasena(pass)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-[#1B2A4A] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#D95D39] shadow-md text-white mb-3.5">
          <Scissors className="w-7 h-7 -rotate-45 text-white" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">
          Textilería Lima
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Sistema de Gestión Interna · Almacén y Ventas
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-6 sm:px-8 shadow-xl rounded-2xl border border-[#E6E3DC]">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg p-3 bg-[#FEE2E2] border border-red-200 flex items-start gap-2 text-[#B91C1C] text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="usuario"
                className="block text-[11px] font-bold text-[#1B2A4A] uppercase tracking-wider mb-1.5"
              >
                Usuario del Sistema
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5A6578]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="usuario"
                  type="text"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="admin, vendedor1, almacen1"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none text-[#1B2A4A] bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contrasena"
                className="block text-[11px] font-bold text-[#1B2A4A] uppercase tracking-wider mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5A6578]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                  required
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-9 py-2 text-xs border border-[#E6E3DC] rounded-lg focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none text-[#1B2A4A] bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5A6578] hover:text-[#1B2A4A] focus:outline-none"
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {mostrarContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-1.5">
              <button
                type="submit"
                disabled={enviando}
                className="w-full flex justify-center items-center gap-1.5 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-[#D95D39] hover:bg-[#C24D2B] focus:outline-none disabled:opacity-50 transition-all duration-150"
              >
                {enviando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  'Ingresar al Sistema'
                )}
              </button>
            </div>
          </form>

          {/* Accesos de Demostración Rápida */}
          <div className="mt-6 pt-4 border-t border-[#E6E3DC]">
            <p className="text-[10px] font-bold text-[#5A6578] uppercase tracking-wider mb-2.5">
              Perfiles para evaluación académica:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => rellenarCredencial('admin', 'Admin123!')}
                className="px-2 py-1.5 text-xs font-semibold text-[#1B2A4A] bg-[#F9F8F5] hover:bg-[#F2F0EA] rounded-lg border border-[#E6E3DC] text-center transition-all duration-150 cursor-pointer"
              >
                admin
              </button>
              <button
                type="button"
                onClick={() => rellenarCredencial('vendedor1', 'Vendedor123!')}
                className="px-2 py-1.5 text-xs font-semibold text-[#1B2A4A] bg-[#F9F8F5] hover:bg-[#F2F0EA] rounded-lg border border-[#E6E3DC] text-center transition-all duration-150 cursor-pointer"
              >
                vendedor1
              </button>
              <button
                type="button"
                onClick={() => rellenarCredencial('almacen1', 'Almacen123!')}
                className="px-2 py-1.5 text-xs font-semibold text-[#1B2A4A] bg-[#F9F8F5] hover:bg-[#F2F0EA] rounded-lg border border-[#E6E3DC] text-center transition-all duration-150 cursor-pointer"
              >
                almacen1
              </button>
              <button
                type="button"
                onClick={() => rellenarCredencial('gerente1', 'Gerente123!')}
                className="px-2 py-1.5 text-xs font-semibold text-[#1B2A4A] bg-[#F9F8F5] hover:bg-[#F2F0EA] rounded-lg border border-[#E6E3DC] text-center transition-all duration-150 cursor-pointer"
              >
                gerente1
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
