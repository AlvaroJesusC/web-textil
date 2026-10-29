import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import type { AlertaStockItem } from '@/types'

interface TablaAlertasStockProps {
  alertas: AlertaStockItem[]
  estaCargando?: boolean
}

export const TablaAlertasStock: React.FC<TablaAlertasStockProps> = ({
  alertas,
  estaCargando,
}) => {
  const navigate = useNavigate()

  if (estaCargando) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Consultando niveles críticos de almacén...
      </div>
    )
  }

  if (alertas.length === 0) {
    return (
      <div className="p-8 text-center bg-[#FAF9F6] rounded-xl border border-[#E5E0D5] flex flex-col items-center justify-center m-4">
        <CheckCircle2 className="w-6 h-6 text-[#15803D] mb-1.5" />
        <p className="text-xs font-bold text-[#1B2A4A]">Abastecimiento Conforme</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Todos los artículos superan su umbral mínimo de seguridad.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-gradient-to-b from-[#F5F3EE] to-[#ECE8DF] border-b border-[#DED9CE] text-[#1B2A4A] font-bold text-[11px]">
            <th className="py-3.5 px-4 w-28 whitespace-nowrap">Código SKU</th>
            <th className="py-3.5 px-4 whitespace-nowrap">Artículo Textil</th>
            <th className="py-3.5 px-4 whitespace-nowrap">Familia</th>
            <th className="py-3.5 px-4 text-right whitespace-nowrap">Saldo Actual</th>
            <th className="py-3.5 px-4 text-right whitespace-nowrap">Mínimo Requerido</th>
            <th className="py-3.5 px-4 text-right whitespace-nowrap">Faltante Mín.</th>
            <th className="py-3.5 px-4 text-center whitespace-nowrap">Condición</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E0D5]/70">
          {alertas.map((prod) => {
            const esAgotado = prod.estado_stock === 'agotado' || prod.stock_actual === 0
            const faltante = Math.max(0, prod.stock_minimo - prod.stock_actual)

            return (
              <tr
                key={prod.producto_id}
                onClick={() => navigate(`/inventario?q=${encodeURIComponent(prod.sku)}`)}
                className={`group fila-interactiva h-12 cursor-pointer ${
                  esAgotado ? 'bg-[#FEE2E2]/20' : ''
                }`}
              >
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
                <td className="py-2.5 px-4 text-right font-extrabold tabular-nums whitespace-nowrap">
                  <span className={esAgotado ? 'text-[#B91C1C]' : 'text-[#B45309]'}>
                    {prod.stock_actual} {prod.unidad}s
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right font-semibold text-slate-600 tabular-nums whitespace-nowrap">
                  {prod.stock_minimo} {prod.unidad}s
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-[#1B2A4A] tabular-nums whitespace-nowrap">
                  {faltante > 0 ? `+${faltante} ${prod.unidad}s` : `Reponer lote`}
                </td>
                <td className="py-2.5 px-4 text-center whitespace-nowrap">
                  {esAgotado ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FEE2E2] text-[#B91C1C]">
                      Agotado (0)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FEF3C7] text-[#B45309]">
                      Bajo mínimo
                    </span>
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
