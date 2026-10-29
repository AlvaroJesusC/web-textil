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
export type EstadoVenta = 'confirmada' | 'anulada'

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

// --- CONCILIACIÓN DE STOCK (RF-27 al RF-29) ---
export type EstadoConteo = 'borrador' | 'cerrado'

export interface DetalleConteo {
  id: number
  producto_id: number
  producto_sku: string
  producto_nombre: string
  categoria_nombre: string
  unidad: string
  stock_sistema: number
  stock_fisico: number | null
  diferencia: number | null
  porcentaje_diferencia: string | number | null
  conforme: boolean | null
  ajustado: boolean
}

export interface ConteoFisico {
  id: number
  fecha: string
  responsable_id: number
  responsable_nombre: string
  estado: EstadoConteo
  observaciones?: string | null
  total_items: number
  items_conformes: number
  items_no_conformes: number
  porcentaje_conformidad: string | number
  cerrado_en?: string | null
  detalles: DetalleConteo[]
}

export interface ConteoFisicoListado {
  id: number
  fecha: string
  responsable_id: number
  responsable_nombre: string
  estado: EstadoConteo
  total_items: number
  items_conformes: number
  items_no_conformes: number
  porcentaje_conformidad: string | number
  cerrado_en?: string | null
}

export interface ItemConteoInput {
  producto_id: number
  stock_fisico: number
}

// --- REPORTES Y MÉTRICAS (RF-30 al RF-32) ---
export interface ResumenVentasKPIs {
  total_ingresos: string
  total_transacciones: number
  ticket_promedio: string
  total_unidades: number
  productos_stock_bajo: number
  productos_agotados: number
}

export interface VentaPorDiaItem {
  fecha: string
  total: string
  cantidad_transacciones: number
}

export interface ProductoMasVendidoItem {
  producto_id: number
  sku: string
  nombre: string
  categoria: string
  unidad: string
  cantidad_vendida: number
  total_recaudado: string
}

export interface VentaPorVendedorItem {
  vendedor_id: number
  vendedor_nombre: string
  cantidad_ventas: number
  total_recaudado: string
}

export interface VentaPorMetodoPagoItem {
  metodo_pago: string
  cantidad_ventas: number
  total_recaudado: string
  porcentaje: string | number
}

export interface AlertaStockItem {
  producto_id: number
  sku: string
  nombre: string
  categoria: string
  unidad: string
  stock_actual: number
  stock_minimo: number
  estado_stock: string
}
