import React from 'react'
import { formatearMoneda } from '@/lib/formato'
import type { VentaPorVendedorItem } from '@/types'

interface TablaVendedoresProps {
  vendedores: VentaPorVendedorItem[]
  estaCargando?: boolean
}

export const TablaVendedores: React.FC<TablaVendedoresProps> = ({
  vendedores,
  estaCargando,
}) => {
  if (estaCargando) {
    return (
      <div className="p-8 text-center text-xs text-[#5A6578]">
        Cargando estadísticas del equipo de ventas...
      </div>
    )
  }

  if (vendedores.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-[#5A6578] italic">
        No se registran ventas para los vendedores en este rango de fechas.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-[#F2F0EA] border-b border-[#E6E3DC] text-[#1B2A4A] font-bold text-[11px] uppercase tracking-wider">
            <th className="py-3 px-4">Asesor de Mostrador</th>
            <th className="py-3 px-4 w-36 text-center">Tickets Emitidos</th>
            <th className="py-3 px-4 w-40 text-right">Recaudación Total</th>
            <th className="py-3 px-4 w-40 text-right">Promedio por Ticket</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E6E3DC]/60">
          {vendedores.map((v) => {
            const total = parseFloat(v.total_recaudado) || 0
            const prom = v.cantidad_ventas > 0 ? total / v.cantidad_ventas : 0

            return (
              <tr key={v.vendedor_id} className="hover:bg-[#F9F8F5] transition-colors h-11">
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1B2A4A]">{v.vendedor_nombre}</span>
                    <span className="text-[10px] text-[#5A6578] font-mono">#{v.vendedor_id}</span>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-center font-bold text-[#1B2A4A] tabular-nums">
                  {v.cantidad_ventas}
                </td>
                <td className="py-2.5 px-4 text-right font-extrabold text-[#1B2A4A] tabular-nums">
                  {formatearMoneda(v.total_recaudado)}
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-[#5A6578] tabular-nums">
                  {formatearMoneda(prom)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
