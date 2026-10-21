import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { Eye, EyeOff, Lock, User, Scissors, AlertCircle, Loader2 } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, estaAutenticado, cargando } = useAuth()

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
      setError('Por favor complete todos los campos obligatorios.')
      return
    }

    try {
      setEnviando(true)
      await login(usuario.trim(), contrasena)
      navigate('/')
    } catch (err: unknown) {
      const apiErr = err as { detalle?: string }
      setError(apiErr.detalle || 'Usuario o contraseña incorrectos.')
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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-900 flex items-center justify-center text-white shadow-md ring-4 ring-blue-100">
            <Scissors className="w-8 h-8 -rotate-45" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Textilería Lima
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          Sistema de Ventas e Inventario · Acceso al sistema
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-slate-200 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-start gap-3 text-rose-800 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="usuario"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Usuario
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="usuario"
                  type="text"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ej: admin, vendedor1, almacen1"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contrasena"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Contraseña
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                  required
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 text-slate-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {mostrarContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={enviando}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-semibold text-white bg-blue-900 hover:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800 disabled:opacity-50 transition-colors"
              >
                {enviando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>
          </form>

          {/* Cuentas de demostración rápida */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Accesos rápidos de prueba (Demostración):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => rellenarCredencial('admin', 'admin1234')}
                className="px-2 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 text-center transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => rellenarCredencial('vendedor1', 'vendedor1234')}
                className="px-2 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 text-center transition-colors"
              >
                Vendedor
              </button>
              <button
                type="button"
                onClick={() => rellenarCredencial('almacen1', 'almacen1234')}
                className="px-2 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 text-center transition-colors"
              >
                Almacén
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
