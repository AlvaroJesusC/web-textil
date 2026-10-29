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
}) => {
  if (conforme === null || porcentaje === null || porcentaje === undefined) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 whitespace-nowrap">
        <HelpCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <span>Sin evaluar</span>
      </span>
    )
  }

  const pctValor = typeof porcentaje === 'string' ? parseFloat(porcentaje) : porcentaje
  const pctFormateado = isNaN(pctValor) ? '0.00' : pctValor.toFixed(2)

  if (conforme) {
    return (
      <div className="inline-flex items-center gap-2 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#DCFCE7] text-[#15803D]">
          <CheckCircle2 className="w-3 h-3 text-[#15803D] shrink-0" />
          <span>Conforme</span>
        </span>
        <span className="text-xs font-bold text-[#15803D] tabular-nums">
          {pctFormateado}%
        </span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#FEE2E2] text-[#B91C1C]">
        <AlertTriangle className="w-3 h-3 text-[#DC2626] shrink-0" />
        <span>Descuadre (&gt; 2%)</span>
      </span>
      <span className="text-xs font-extrabold text-[#B91C1C] tabular-nums">
        {pctFormateado}%
      </span>
    </div>
  )
}
