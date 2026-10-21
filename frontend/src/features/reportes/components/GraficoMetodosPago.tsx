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
  efectivo: '#15803D', // Verde tintorero
  yape_plin: '#7C3AED', // Púrpura billetera digital
  transferencia: '#1E3A8A', // Azul telar
  tarjeta: '#D97706', // Ámbar mostaza
}

export const GraficoMetodosPago: React.FC<GraficoMetodosPagoProps> = ({
  datos,
  estaCargando,
}) => {
  if (estaCargando) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-200">
        <span className="text-xs text-slate-400 font-mono">Cargando métodos de pago...</span>
      </div>
    )
  }

  if (datos.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
        Sin transacciones registradas en este periodo
      </div>
    )
  }

  const datosFormateados = datos.map((d) => ({
    ...d,
    nombreMetodo: ETIQUETAS_PAGO[d.metodo_pago] || d.metodo_pago,
    montoNumerico: parseFloat(d.total_recaudado) || 0,
    color: COLORES_PAGO[d.metodo_pago] || '#3B82F6',
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datosFormateados}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis
            type="number"
            stroke="#64748B"
            fontSize={11}
            tickFormatter={(val) => `S/ ${val}`}
          />
          <YAxis
            type="category"
            dataKey="nombreMetodo"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as typeof datosFormateados[0]
                return (
                  <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs space-y-1 border border-slate-800">
                    <p className="font-semibold">{item.nombreMetodo}</p>
                    <p className="text-emerald-400 font-mono font-bold">
                      {formatearMoneda(item.montoNumerico)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {item.cantidad_ventas} transacciones ({Number(item.porcentaje).toFixed(1)}%)
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="montoNumerico" radius={[0, 4, 4, 0]} barSize={20}>
            {datosFormateados.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
