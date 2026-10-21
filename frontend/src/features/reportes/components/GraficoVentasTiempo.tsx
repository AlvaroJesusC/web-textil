import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatearMoneda } from '@/lib/formato'
import type { VentaPorDiaItem } from '@/types'

interface GraficoVentasTiempoProps {
  datos: VentaPorDiaItem[]
  estaCargando?: boolean
}

export const GraficoVentasTiempo: React.FC<GraficoVentasTiempoProps> = ({
  datos,
  estaCargando,
}) => {
  if (estaCargando) {
    return (
      <div className="h-72 w-full flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-200">
        <span className="text-xs text-slate-400 font-mono">Cargando gráfico de tendencias...</span>
      </div>
    )
  }

  if (datos.length === 0) {
    return (
      <div className="h-72 w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 text-center">
        <p className="text-xs font-semibold text-slate-700">Sin ventas en este periodo</p>
        <p className="text-[11px] text-slate-400 mt-1">
          No se registraron ventas confirmadas en el rango de fechas seleccionado.
        </p>
      </div>
    )
  }

  // Mapeo seguro con números para Recharts
  const datosFormateados = datos.map((d) => ({
    ...d,
    totalNumerico: parseFloat(d.total) || 0,
    etiquetaFecha: d.fecha.slice(5), // MM-DD para que sea limpio
  }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={datosFormateados}
          margin={{ top: 10, right: 15, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorAzulTelar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="etiquetaFecha"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#CBD5E1' }}
          />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `S/ ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as typeof datosFormateados[0]
                return (
                  <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs space-y-1 border border-slate-800">
                    <p className="font-semibold text-slate-200">{item.fecha}</p>
                    <p className="text-blue-300 font-mono font-bold text-sm">
                      {formatearMoneda(item.totalNumerico)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {item.cantidad_transacciones} venta(s) confirmada(s)
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="totalNumerico"
            stroke="#1E3A8A"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorAzulTelar)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
