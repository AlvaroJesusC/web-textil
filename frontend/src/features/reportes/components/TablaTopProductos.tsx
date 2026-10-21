import React from 'react'
import { Trophy } from 'lucide-react'
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
      <div className="p-8 text-center text-xs text-slate-400 font-mono">
        Cargando ranking de productos textiles...
      </div>
    )
  }

  if (productos.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 italic">
        Aún no hay productos vendidos en este rango de fechas.
      </div>
    )
  }

  const maxCantidad = Math.max(...productos.map((p) => p.cantidad_vendida), 1)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <th className="py-3 px-4 w-12 text-center">#</th>
            <th className="py-3 px-4">SKU / Producto</th>
            <th className="py-3 px-4">Categoría</th>
            <th className="py-3 px-4 text-right">Cantidad Vendida</th>
            <th className="py-3 px-4 w-36">Rotación</th>
            <th className="py-3 px-4 text-right">Recaudación Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {productos.map((prod, index) => {
            const porcentajeRelativo = Math.round((prod.cantidad_vendida / maxCantidad) * 100)
            const esTop3 = index < 3

            return (
              <tr key={prod.producto_id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 text-center">
                  {index === 0 ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                      <Trophy className="w-3 h-3 text-amber-600" />
                    </span>
                  ) : esTop3 ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-800 font-bold text-[11px]">
                      {index + 1}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono font-medium">{index + 1}</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{prod.nombre}</div>
                  <div className="font-mono text-[11px] text-slate-400">{prod.sku}</div>
                </td>
                <td className="py-3 px-4 text-slate-600">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                    {prod.categoria}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                  {prod.cantidad_vendida}{' '}
                  <span className="text-[11px] font-normal text-slate-500 capitalize">
                    {prod.unidad}(s)
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        index === 0
                          ? 'bg-amber-500'
                          : esTop3
                            ? 'bg-blue-800'
                            : 'bg-slate-400'
                      }`}
                      style={{ width: `${porcentajeRelativo}%` }}
                    />
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums text-sm">
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
