import React, { useState, useEffect } from 'react'
import type { Usuario, RolUsuario } from '@/types'
import {
  peticionApi,
  guardarSesion,
  cerrarSesionLocal,
  obtenerUsuarioLocal,
  obtenerToken,
} from '@/lib/api-client'
import { AuthContext } from './authContextDef'

interface LoginRespuesta {
  access_token: string
  token_type: string
  usuario: Usuario
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(() => obtenerUsuarioLocal<Usuario>())
  const [cargando, setCargando] = useState<boolean>(true)

  useEffect(() => {
    const verificarSesion = async () => {
      const token = obtenerToken()
      if (token) {
        try {
          const perfil = await peticionApi<Usuario>('/auth/me')
          setUsuario(perfil)
          guardarSesion(token, perfil)
        } catch {
          cerrarSesionLocal()
          setUsuario(null)
        }
      } else {
        setUsuario(null)
      }
      setCargando(false)
    }

    verificarSesion()
  }, [])

  const login = async (nombreUsuario: string, contrasena: string) => {
    const data = await peticionApi<LoginRespuesta>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario: nombreUsuario, contrasena }),
    })
    guardarSesion(data.access_token, data.usuario)
    setUsuario(data.usuario)
  }

  const logout = () => {
    cerrarSesionLocal()
    setUsuario(null)
    window.location.href = '/login'
  }

  const tieneRol = (...roles: RolUsuario[]): boolean => {
    if (!usuario) return false
    return roles.includes(usuario.rol)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        estaAutenticado: !!usuario,
        cargando,
        login,
        logout,
        tieneRol,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

