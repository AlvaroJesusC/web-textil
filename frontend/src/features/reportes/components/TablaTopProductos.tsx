import React from 'react'
import { formatearMoneda } from '@/lib/formato'
import type { ProductoMasVendidoItem } from '@/types'

interface TablaTopProductosProps {
  productos: ProductoMasVendidoItem[]
  estaCargando?: boolean
}

export const TablaTopProductos: React.FC<TablaTopProductosProps> = ({
  productos,
  estaCargando,
}) => {
  if (estaCargando) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Consultando ranking de rotación textil...
      </div>
    )
  }

  if (productos.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        No se registran salidas de productos en el rango de fechas seleccionado.
      </div>
    )
  }

  const maxCantidad = Math.max(...productos.map((p) => p.cantidad_vendida), 1)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-gradient-to-b from-[#F5F3EE] to-[#ECE8DF] border-b border-[#DED9CE] text-[#1B2A4A] font-bold text-[11px]">
            <th className="py-3.5 px-4 w-12 text-center whitespace-nowrap">Pos.</th>
            <th className="py-3.5 px-4 w-28 whitespace-nowrap">Código SKU</th>
            <th className="py-3.5 px-4 whitespace-nowrap">Artículo Textil</th>
            <th className="py-3.5 px-4 whitespace-nowrap">Familia</th>
            <th className="py-3.5 px-4 text-right whitespace-nowrap">Volumen Despachado</th>
            <th className="py-3.5 px-4 w-40 whitespace-nowrap">Índice de Rotación</th>
            <th className="py-3.5 px-4 text-right whitespace-nowrap">Importe Recaudado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E0D5]/70">
          {productos.map((prod, index) => {
            const porcentajeRelativo = Math.round((prod.cantidad_vendida / maxCantidad) * 100)
            const colorBarra =
              index === 0
                ? 'bg-[#D95D39]'
                : index < 3
                  ? 'bg-[#2452E8]'
                  : 'bg-[#1B2A4A]'

            return (
              <tr key={prod.producto_id} className="group fila-interactiva h-12">
                <td className="py-2.5 px-4 text-center font-bold text-slate-500 text-xs tabular-nums whitespace-nowrap">
                  {index + 1}
                </td>
                <td className="py-2.5 px-4 whitespace-nowrap">
                  <span className="font-mono font-bold text-[#1B2A4A] bg-[#F2F0EA] group-hover:bg-[#1B2A4A] group-hover:text-white px-2 py-0.5 rounded-md transition-colors text-xs">
                    {prod.sku}
                  </span>
                </td>
                <td className="py-2.5 px-4 font-bold text-[#1B2A4A] group-hover:text-[#2452E8] transition-colors">
                  {prod.nombre}
                </td>
                <td className="py-2.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                  {prod.categoria}
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-[#1B2A4A] tabular-nums whitespace-nowrap">
                  {prod.cantidad_vendida} {prod.unidad}s
                </td>
                <td className="py-2.5 px-4">
                  <div className="w-full min-w-[100px] bg-[#ECE8DF] rounded-full h-2 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full ${colorBarra} transition-all duration-300`}
                      style={{ width: `${porcentajeRelativo}%` }}
                    />
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right font-extrabold text-[#1B2A4A] tabular-nums whitespace-nowrap">
                  {formatearMoneda(prod.total_recaudado)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
