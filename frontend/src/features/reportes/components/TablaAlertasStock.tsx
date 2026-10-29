import React from 'react'
import { AlertCircle, AlertOctagon, CheckCircle2 } from 'lucide-react'
import type { AlertaStockItem } from '@/types'

interface TablaAlertasStockProps {
  alertas: AlertaStockItem[]
  estaCargando?: boolean
}

export const TablaAlertasStock: React.FC<TablaAlertasStockProps> = ({
  alertas,
  estaCargando,
}) => {
  if (estaCargando) {
    return (
      <div className="p-8 text-center text-xs text-[#5A6578]">
        Consultando alertas de inventario crítico...
      </div>
    )
  }

  if (alertas.length === 0) {
    return (
      <div className="p-8 text-center bg-[#F9F8F5] rounded-xl border border-[#E6E3DC] flex flex-col items-center justify-center m-4">
        <CheckCircle2 className="w-6 h-6 text-[#15803D] mb-1.5" />
        <p className="text-xs font-bold text-[#1B2A4A]">Stock Óptimo en Todos los Productos</p>
        <p className="text-[11px] text-[#5A6578] mt-0.5">
          No hay artículos por debajo de su stock mínimo ni existencias en cero.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-[#F2F0EA] border-b border-[#E6E3DC] text-[#1B2A4A] font-bold text-[11px] uppercase tracking-wider">
            <th className="py-3 px-4 whitespace-nowrap">Estado</th>
            <th className="py-3 px-4 w-28 whitespace-nowrap">SKU</th>
            <th className="py-3 px-4 whitespace-nowrap">Artículo Textil</th>
            <th className="py-3 px-4 whitespace-nowrap">Familia</th>
            <th className="py-3 px-4 text-right whitespace-nowrap">Stock Actual</th>
            <th className="py-3 px-4 text-right whitespace-nowrap">Stock Mínimo</th>
            <th className="py-3 px-4 text-center whitespace-nowrap">Prioridad</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E6E3DC]/60">
          {alertas.map((prod) => {
            const esAgotado = prod.estado_stock === 'agotado' || prod.stock_actual === 0

            return (
              <tr
                key={prod.producto_id}
                className={`hover:bg-[#F9F8F5] transition-colors h-11 ${
                  esAgotado ? 'bg-[#FEE2E2]/25' : 'bg-[#FEF3C7]/20'
                }`}
              >
                <td className="py-2.5 px-4 whitespace-nowrap">
                  {esAgotado ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FEE2E2] text-[#B91C1C] border border-red-200 uppercase whitespace-nowrap">
                      <AlertOctagon className="w-3 h-3 text-[#DC2626] shrink-0" /> Agotado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-amber-200 uppercase whitespace-nowrap">
                      <AlertCircle className="w-3 h-3 text-[#D97706] shrink-0" /> Stock Bajo
                    </span>
                  )}
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
                <td className="py-2.5 px-4 text-right font-bold tabular-nums whitespace-nowrap">
                  <span className={esAgotado ? 'text-[#B91C1C]' : 'text-[#B45309]'}>
                    {prod.stock_actual}
                  </span>{' '}
                  <span className="text-[10px] font-normal text-[#5A6578] capitalize">
                    {prod.unidad}(s)
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-[#5A6578] tabular-nums whitespace-nowrap">
                  {prod.stock_minimo} {prod.unidad}(s)
                </td>
                <td className="py-2.5 px-4 text-center whitespace-nowrap">
                  {esAgotado ? (
                    <span className="text-[11px] font-bold text-[#B91C1C]">Urgente</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-[#B45309]">Reabastecer</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
