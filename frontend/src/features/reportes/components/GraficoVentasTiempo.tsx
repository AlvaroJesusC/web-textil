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
      <div className="h-64 w-full flex items-center justify-center bg-[#F9F8F5] rounded-xl border border-[#E6E3DC]">
        <span className="text-xs text-[#1B2A4A] font-semibold">
          Cargando gráfico de tendencias...
        </span>
      </div>
    )
  }

  if (datos.length === 0) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center bg-[#F9F8F5] rounded-xl border border-dashed border-[#E6E3DC] p-6 text-center">
        <p className="text-xs font-bold text-[#1B2A4A]">Sin ventas en este periodo</p>
        <p className="text-[11px] text-slate-500 mt-1">
          No se registraron ventas confirmadas en el rango de fechas seleccionado.
        </p>
      </div>
    )
  }

  const datosFormateados = datos.map((d) => ({
    ...d,
    totalNumerico: parseFloat(d.total) || 0,
    etiquetaFecha: d.fecha.slice(5),
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={datosFormateados}
          margin={{ top: 10, right: 15, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCobalto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2452E8" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#2452E8" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E6E3DC" vertical={false} />
          <XAxis
            dataKey="etiquetaFecha"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#E6E3DC' }}
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
                  <div className="bg-[#1B2A4A] text-white px-3.5 py-2.5 rounded-xl shadow-lg text-xs space-y-1 border border-white/15">
                    <p className="text-[11px] text-slate-300 font-medium">{item.fecha}</p>
                    <p className="text-white font-extrabold text-sm tabular-nums">
                      {formatearMoneda(item.totalNumerico)}
                    </p>
                    <p className="text-[10px] text-[#FFD0C2] font-semibold">
                      {item.cantidad_transacciones} comprobante(s)
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
            stroke="#2452E8"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorCobalto)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
