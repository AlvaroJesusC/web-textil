import React from 'react'
import { UserCheck } from 'lucide-react'
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
      <div className="p-8 text-center text-xs text-slate-400 font-mono">
        Cargando estadísticas del equipo de ventas...
      </div>
    )
  }

  if (vendedores.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 italic">
        No se registran ventas para los vendedores en este rango de fechas.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <th className="py-3 px-4">Vendedor / Asesor Comercial</th>
            <th className="py-3 px-4 text-center">Tickets Emitidos</th>
            <th className="py-3 px-4 text-right">Recaudación Total</th>
            <th className="py-3 px-4 text-right">Promedio por Ticket</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {vendedores.map((v) => {
            const total = parseFloat(v.total_recaudado) || 0
            const prom = v.cantidad_ventas > 0 ? total / v.cantidad_ventas : 0

            return (
              <tr key={v.vendedor_id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs">
                      <UserCheck className="w-3.5 h-3.5 text-blue-800" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{v.vendedor_nombre}</div>
                      <div className="text-[11px] text-slate-400">ID #{v.vendedor_id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 tabular-nums">
                  {v.cantidad_ventas}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums text-sm">
                  {formatearMoneda(v.total_recaudado)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-600 tabular-nums">
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
