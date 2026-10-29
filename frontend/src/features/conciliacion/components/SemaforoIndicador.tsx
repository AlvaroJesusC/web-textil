import React from 'react'
import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react'

interface SemaforoIndicadorProps {
  conforme: boolean | null
  porcentaje: string | number | null
  diferencia?: number | null
}

export const SemaforoIndicador: React.FC<SemaforoIndicadorProps> = ({
  conforme,
  porcentaje,
  diferencia,
}) => {
  if (conforme === null || porcentaje === null || porcentaje === undefined) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-[#F2F0EA] text-slate-600 whitespace-nowrap">
        <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
        <span>Pendiente</span>
      </span>
    )
  }

  const pctValor = typeof porcentaje === 'string' ? parseFloat(porcentaje) : porcentaje
  const pctFormateado = isNaN(pctValor) ? '0.00' : pctValor.toFixed(2)

  if (conforme) {
    return (
      <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#DCFCE7] text-[#15803D] whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 text-[#15803D] shrink-0" />
          <span>≤ 2% Conforme</span>
        </span>
        <span className="text-xs font-bold text-[#15803D] tabular-nums whitespace-nowrap">
          {pctFormateado}%
          {diferencia !== undefined && diferencia !== null && (
            <span className="text-slate-400 font-normal ml-1">
              ({diferencia > 0 ? `+${diferencia}` : diferencia})
            </span>
          )}
        </span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#FEE2E2] text-[#B91C1C] whitespace-nowrap">
        <AlertTriangle className="w-3 h-3 text-[#DC2626] shrink-0" />
        <span>&gt; 2% Descuadre</span>
      </span>
      <span className="text-xs font-bold text-[#B91C1C] tabular-nums whitespace-nowrap">
        {pctFormateado}%
        {diferencia !== undefined && diferencia !== null && (
          <span className="text-[#DC2626] font-medium ml-1">
            ({diferencia > 0 ? `+${diferencia}` : diferencia})
          </span>
        )}
      </span>
    </div>
  )
}
