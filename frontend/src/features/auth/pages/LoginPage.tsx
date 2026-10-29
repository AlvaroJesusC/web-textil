import React, { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Scissors,
  AlertCircle,
  Loader2,
} from 'lucide-react'

const PERFILES_DEMO = [
  { rol: 'Administrador', usuario: 'admin', pass: 'Admin123!' },
  { rol: 'Mostrador POS', usuario: 'vendedor1', pass: 'Vendedor123!' },
  { rol: 'Almacén Textil', usuario: 'almacen1', pass: 'Almacen123!' },
  { rol: 'Gerencia', usuario: 'gerente1', pass: 'Gerente123!' },
]

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, estaAutenticado, cargando } = useAuth()

  useEffect(() => {
    document.title = 'Acceso de Personal · Textilería Lima'
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
      setError('Por favor ingrese su usuario y contraseña.')
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
    <div className="min-h-screen flex items-center justify-center py-10 px-4 sm:px-6 font-sans">
      <div className="w-full max-w-md">
        <div className="card-textil border-t-[3px] border-t-[#D95D39] py-8 px-6 sm:px-8 rounded-2xl shadow-xl">
          {/* Cabecera compacta de marca dentro del login */}
          <div className="flex items-center gap-3.5 pb-5 mb-5 border-b border-[#E5E0D5]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#E56A46] to-[#CF4F2B] border border-[#B03E1E] flex items-center justify-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_6px_rgba(217,93,57,0.3)] shrink-0">
              <Scissors className="w-5 h-5 -rotate-45 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#1B2A4A] tracking-tight leading-none">
                Textilería Lima S.A.C.
              </h1>
              <p className="text-[11px] text-slate-500 mt-1">
                Ingreso de Personal Autorizado
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl p-3 bg-[#FEE2E2] border border-red-200 flex items-start gap-2 text-[#B91C1C] text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="usuario"
                className="block text-xs font-bold text-[#1B2A4A] mb-1.5"
              >
                Usuario asignado
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2452E8]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="usuario"
                  type="text"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ej. admin, vendedor1, almacen1"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs rounded-xl input-textil font-medium"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contrasena"
                className="block text-xs font-bold text-[#1B2A4A] mb-1.5"
              >
                Clave de acceso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#2452E8]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                  required
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-9 py-2.5 text-xs rounded-xl input-textil font-medium"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#1B2A4A] focus:outline-none cursor-pointer"
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {mostrarContrasena ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={enviando}
                className="w-full flex justify-center items-center gap-1.5 py-3 px-4 rounded-xl btn-terracota text-xs font-bold"
              >
                {enviando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  'Iniciar Turno en Sistema'
                )}
              </button>
            </div>
          </form>

          {/* Selección rápida de roles con Tarjetas Táctiles */}
          <div className="mt-6 pt-5 border-t border-[#E5E0D5]">
            <p className="text-[11px] font-bold text-slate-500 mb-2.5">
              Cuentas rápidas por puesto de trabajo (Evaluación):
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PERFILES_DEMO.map((p) => {
                const seleccionado = usuario === p.usuario
                return (
                  <button
                    key={p.usuario}
                    type="button"
                    onClick={() => rellenarCredencial(p.usuario, p.pass)}
                    className={`px-3.5 py-2.5 rounded-xl text-left ${
                      seleccionado ? 'btn-indigo' : 'btn-superficie'
                    }`}
                  >
                    <span className="text-xs font-bold block leading-tight">{p.rol}</span>
                    <span
                      className={`text-[10px] font-mono block mt-0.5 ${
                        seleccionado ? 'text-[#FFD0C2]' : 'text-slate-500'
                      }`}
                    >
                      {p.usuario}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
