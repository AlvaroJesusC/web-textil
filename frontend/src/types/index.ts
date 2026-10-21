/**
 * Definiciones de tipos del Sistema Textilería sincronizadas con los schemas de FastAPI.
 */

export type RolUsuario = 'administrador' | 'vendedor' | 'almacenero' | 'gerente'
export type EstadoUsuario = 'activo' | 'inactivo' | 'bloqueado'

export interface Usuario {
  id: number
  nombre: string
  usuario: string
  rol: RolUsuario
  estado: EstadoUsuario
  debe_cambiar_clave: boolean
  creado_en: string
}

export type UnidadMedida = 'metro' | 'cono' | 'unidad' | 'bolsa'
export type EstadoStock = 'normal' | 'bajo' | 'agotado'
export type EstadoProducto = 'activo' | 'inactivo'

export interface Categoria {
  id: number
  nombre: string
  descripcion?: string | null
  creado_en: string
}

export interface Producto {
  id: number
  sku: string
  nombre: string
  descripcion?: string | null
  categoria_id: number
  categoria_nombre?: string | null
  unidad: UnidadMedida
  precio: string // Serializado como string decimal en FastAPI
  stock_actual: number
  stock_minimo: number
  estado: EstadoProducto
  estado_stock: EstadoStock
  creado_en: string
  actualizado_en: string
}

export interface ProductoListadoRespuesta {
  items: Producto[]
  total: number
  pagina: number
  por_pagina: number
}

export interface ProductoCrearPeticion {
  sku: string
  nombre: string
  descripcion?: string
  categoria_id: number
  unidad: UnidadMedida
  precio: number
  stock_actual: number
  stock_minimo: number
}

export interface ProductoActualizarPeticion {
  nombre?: string
  descripcion?: string
  categoria_id?: number
  unidad?: UnidadMedida
  precio?: number
  stock_minimo?: number
  estado?: EstadoProducto
}

export type MetodoPago = 'efectivo' | 'yape_plin' | 'transferencia' | 'tarjeta'
export type EstadoVenta = 'completada' | 'anulada'

export interface DetalleVenta {
  id: number
  producto_id: number
  producto_nombre?: string | null
  producto_sku?: string | null
  cantidad: number
  precio_unitario: string
  subtotal: string
}

export interface Venta {
  id: number
  numero: string
  fecha: string
  vendedor_id: number
  vendedor_nombre?: string | null
  cliente_nombre?: string | null
  cliente_documento?: string | null
  metodo_pago: MetodoPago
  subtotal: string
  descuento_pct: string
  descuento: string
  igv: string
  total: string
  estado: EstadoVenta
  motivo_anulacion?: string | null
  detalles: DetalleVenta[]
}

export interface VentaListadoRespuesta {
  items: Venta[]
  total: number
  pagina: number
  por_pagina: number
}

export interface ItemVentaCrear {
  producto_id: number
  cantidad: number
}

export interface VentaCrearPeticion {
  items: ItemVentaCrear[]
  descuento_pct: number
  metodo_pago: MetodoPago
  cliente_nombre?: string
  cliente_documento?: string
}

export interface MovimientoInventario {
  id: number
  producto_id: number
  tipo: string
  cantidad: number
  stock_anterior: number
  stock_resultante: number
  motivo?: string | null
  proveedor?: string | null
  documento?: string | null
  usuario_id?: number | null
  fecha: string
}
