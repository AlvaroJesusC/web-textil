import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatearMoneda } from '@/lib/formato'
import type { VentaPorMetodoPagoItem } from '@/types'

interface GraficoMetodosPagoProps {
  datos: VentaPorMetodoPagoItem[]
  estaCargando?: boolean
}

const ETIQUETAS_PAGO: Record<string, string> = {
  efectivo: 'Efectivo',
  yape_plin: 'Yape / Plin',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta Débito/Crédito',
}

const COLORES_PAGO: Record<string, string> = {
  efectivo: '#1B2A4A', // Índigo Telar
  yape_plin: '#D95D39', // Terracota Teja
  transferencia: '#2452E8', // Azul Cobalto
  tarjeta: '#15803D', // Verde Tintorero
}

export const GraficoMetodosPago: React.FC<GraficoMetodosPagoProps> = ({
  datos,
  estaCargando,
}) => {
  if (estaCargando) {
    return (
      <div className="h-60 w-full flex items-center justify-center bg-[#F9F8F5] rounded-xl border border-[#E6E3DC]">
        <span className="text-xs text-[#1B2A4A] font-semibold">Cargando medios de cobro...</span>
      </div>
    )
  }

  if (datos.length === 0) {
    return (
      <div className="h-60 w-full flex items-center justify-center bg-[#F9F8F5] rounded-xl border border-dashed border-[#E6E3DC] p-6 text-center text-xs text-slate-400">
        Sin transacciones registradas en este periodo
      </div>
    )
  }

  const datosFormateados = datos.map((d) => ({
    ...d,
    nombreMetodo: ETIQUETAS_PAGO[d.metodo_pago] || d.metodo_pago,
    montoNumerico: parseFloat(d.total_recaudado) || 0,
    color: COLORES_PAGO[d.metodo_pago] || '#2452E8',
  }))

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datosFormateados}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E6E3DC" />
          <XAxis
            type="number"
            stroke="#64748B"
            fontSize={11}
            tickFormatter={(val) => `S/ ${val}`}
          />
          <YAxis
            type="category"
            dataKey="nombreMetodo"
            stroke="#1B2A4A"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={125}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as typeof datosFormateados[0]
                return (
                  <div className="bg-[#1B2A4A] text-white px-3.5 py-2.5 rounded-xl shadow-lg text-xs space-y-1 border border-white/15">
                    <p className="font-bold">{item.nombreMetodo}</p>
                    <p className="text-white font-extrabold tabular-nums">
                      {formatearMoneda(item.montoNumerico)}
                    </p>
                    <p className="text-[10px] text-[#FFD0C2] font-semibold">
                      {item.cantidad_ventas} operaciones ({Number(item.porcentaje).toFixed(1)}%)
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="montoNumerico" radius={[0, 6, 6, 0]}>
            {datosFormateados.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
