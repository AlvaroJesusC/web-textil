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
      <div className="p-8 text-center text-xs text-slate-500">
        Cargando productividad por operador de mostrador...
      </div>
    )
  }

  if (vendedores.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        No se registran operaciones en este rango de fechas.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-gradient-to-b from-[#F5F3EE] to-[#ECE8DF] border-b border-[#DED9CE] text-[#1B2A4A] font-bold text-[11px]">
            <th className="py-3.5 px-4">Operador de Mostrador</th>
            <th className="py-3.5 px-4 w-36 text-center">Tickets Emitidos</th>
            <th className="py-3.5 px-4 w-40 text-right">Ticket Promedio</th>
            <th className="py-3.5 px-4 w-40 text-right">Recaudación Acumulada</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E0D5]/70">
          {vendedores.map((v) => {
            const total = parseFloat(v.total_recaudado) || 0
            const prom = v.cantidad_ventas > 0 ? total / v.cantidad_ventas : 0

            return (
              <tr key={v.vendedor_id} className="group fila-interactiva h-12">
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1B2A4A] group-hover:text-[#2452E8] transition-colors">
                      {v.vendedor_nombre}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ID #{v.vendedor_id}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-center font-bold text-[#1B2A4A] tabular-nums">
                  {v.cantidad_ventas}
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-slate-600 tabular-nums">
                  {formatearMoneda(prom)}
                </td>
                <td className="py-2.5 px-4 text-right font-extrabold text-[#1B2A4A] tabular-nums">
                  {formatearMoneda(v.total_recaudado)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
