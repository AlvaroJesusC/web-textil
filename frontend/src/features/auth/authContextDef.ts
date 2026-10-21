import { createContext } from 'react'
import type { Usuario, RolUsuario } from '@/types'

export interface AuthContextType {
  usuario: Usuario | null
  estaAutenticado: boolean
  cargando: boolean
  login: (usuario: string, contrasena: string) => Promise<void>
  logout: () => void
  tieneRol: (...roles: RolUsuario[]) => boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
