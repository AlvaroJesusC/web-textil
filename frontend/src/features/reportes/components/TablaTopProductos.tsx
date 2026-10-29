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
      <div className="p-8 text-center text-xs text-[#5A6578]">
        Cargando ranking de productos textiles...
      </div>
    )
  }

  if (productos.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-[#5A6578] italic">
        Aún no hay productos vendidos en este rango de fechas.
      </div>
    )
  }

  const maxCantidad = Math.max(...productos.map((p) => p.cantidad_vendida), 1)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-[#F2F0EA] border-b border-[#E6E3DC] text-[#1B2A4A] font-bold text-[11px] uppercase tracking-wider">
            <th className="py-3 px-4 w-12 text-center whitespace-nowrap">#</th>
            <th className="py-3 px-4 w-28 whitespace-nowrap">SKU</th>
            <th className="py-3 px-4 whitespace-nowrap">Artículo Textil</th>
            <th className="py-3 px-4 whitespace-nowrap">Familia</th>
            <th className="py-3 px-4 text-right whitespace-nowrap">Cantidad Vendida</th>
            <th className="py-3 px-4 w-36 whitespace-nowrap">Rotación</th>
            <th className="py-3 px-4 text-right whitespace-nowrap">Recaudación Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E6E3DC]/60">
          {productos.map((prod, index) => {
            const porcentajeRelativo = Math.round((prod.cantidad_vendida / maxCantidad) * 100)
            const colorBarra =
              index === 0
                ? 'bg-[#D95D39]'
                : index < 3
                  ? 'bg-[#2452E8]'
                  : 'bg-[#1B2A4A]'

            return (
              <tr key={prod.producto_id} className="hover:bg-[#F9F8F5] transition-colors h-11">
                <td className="py-2.5 px-4 text-center font-bold text-[#5A6578] text-xs tabular-nums whitespace-nowrap">
                  {index + 1}
                </td>
                <td className="py-2.5 px-4 font-mono font-semibold text-[#1B2A4A] text-xs whitespace-nowrap">
                  {prod.sku}
                </td>
                <td className="py-2.5 px-4 font-semibold text-[#1B2A4A]">
                  {prod.nombre}
                </td>
                <td className="py-2.5 px-4 text-[#5A6578] whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#F9F8F5] text-[#1B2A4A] border border-[#E6E3DC] whitespace-nowrap">
                    {prod.categoria}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-[#1B2A4A] tabular-nums whitespace-nowrap">
                  {prod.cantidad_vendida}{' '}
                  <span className="text-[10px] font-normal text-[#5A6578] capitalize">
                    {prod.unidad}(s)
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="w-full min-w-[96px] bg-[#F2F0EA] rounded-full h-2 overflow-hidden">
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
