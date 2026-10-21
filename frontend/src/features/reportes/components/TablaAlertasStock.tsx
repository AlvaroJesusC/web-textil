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
      <div className="p-8 text-center text-xs text-slate-400 font-mono">
        Consultando alertas de inventario crítico...
      </div>
    )
  }

  if (alertas.length === 0) {
    return (
      <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
        <p className="text-xs font-bold text-emerald-900">Stock Óptimo en Todos los Productos</p>
        <p className="text-[11px] text-emerald-700 mt-0.5">
          No hay artículos por debajo de su stock mínimo ni existencias en cero.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <th className="py-3 px-4">Estado</th>
            <th className="py-3 px-4">SKU / Producto</th>
            <th className="py-3 px-4">Categoría</th>
            <th className="py-3 px-4 text-right">Stock Actual</th>
            <th className="py-3 px-4 text-right">Stock Mínimo</th>
            <th className="py-3 px-4 text-center">Nivel de Riesgo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {alertas.map((prod) => {
            const esAgotado = prod.estado_stock === 'agotado' || prod.stock_actual === 0

            return (
              <tr
                key={prod.producto_id}
                className={`hover:bg-slate-50/70 transition-colors ${
                  esAgotado ? 'bg-rose-50/30' : 'bg-amber-50/20'
                }`}
              >
                <td className="py-3 px-4">
                  {esAgotado ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                      <AlertOctagon className="w-3 h-3 text-rose-600" /> Agotado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                      <AlertCircle className="w-3 h-3 text-amber-600" /> Stock Bajo
                    </span>
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
                <td className="py-3 px-4 text-right font-mono font-bold text-sm tabular-nums">
                  <span className={esAgotado ? 'text-rose-600' : 'text-amber-700'}>
                    {prod.stock_actual}
                  </span>{' '}
                  <span className="text-[11px] font-normal text-slate-400 capitalize">
                    {prod.unidad}(s)
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                  {prod.stock_minimo} {prod.unidad}(s)
                </td>
                <td className="py-3 px-4 text-center">
                  {esAgotado ? (
                    <span className="text-xs font-bold text-rose-700">Reposición Urgente</span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-700">Reabastecer</span>
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
