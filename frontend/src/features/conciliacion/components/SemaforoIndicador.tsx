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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
        <span>Pendiente</span>
      </span>
    )
  }

  const pctValor = typeof porcentaje === 'string' ? parseFloat(porcentaje) : porcentaje
  const pctFormateado = isNaN(pctValor) ? '0.00' : pctValor.toFixed(2)

  if (conforme) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Conforme</span>
        </span>
        <span className="text-xs font-mono font-medium text-emerald-700 tabular-nums">
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
    <div className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>Desviación &gt; 2%</span>
      </span>
      <span className="text-xs font-mono font-bold text-rose-700 tabular-nums">
        {pctFormateado}%
        {diferencia !== undefined && diferencia !== null && (
          <span className="text-rose-500 font-medium ml-1">
            ({diferencia > 0 ? `+${diferencia}` : diferencia})
          </span>
        )}
      </span>
    </div>
  )
}
