import React, { useState } from 'react'
import {
  Scale,
  Plus,
  Calculator,
  Save,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  History,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import {
  useConteos,
  useConteo,
  useIniciarConteo,
  useGuardarItemsConteo,
  useCalcularDiferencias,
  useCerrarConteo,
  useAjustarStockConteo,
} from '../hooks'
import { SemaforoIndicador } from '../components/SemaforoIndicador'
import { IniciarConteoModal } from '../components/IniciarConteoModal'
import { AjustarStockModal } from '../components/AjustarStockModal'
import { useAuth } from '@/features/auth'
import { formatearFecha } from '@/lib/formato'
import type { DetalleConteo, ItemConteoInput } from '@/types'

export const ConciliacionPage: React.FC = () => {
  const { tieneRol } = useAuth()
  const esAdmin = tieneRol('administrador')
  const puedeOperar = tieneRol('administrador', 'almacenero')

  const [modalIniciarAbierto, setModalIniciarAbierto] = useState(false)
  const [modalAjustarAbierto, setModalAjustarAbierto] = useState(false)
  const [idConteoSeleccionado, setIdConteoSeleccionado] = useState<number | null>(null)
  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [filtroConformidad, setFiltroConformidad] = useState<
    'todos' | 'conformes' | 'desviacion' | 'pendientes'
  >('todos')

  // Consultas TanStack Query
  const { data: listaConteos = [], isLoading: cargandoLista } = useConteos()
  const idConteoEfectivo =
    idConteoSeleccionado ??
    (listaConteos.find((c) => c.estado === 'borrador')?.id ?? listaConteos[0]?.id ?? null)
  const { data: conteoActual, isLoading: cargandoConteo } = useConteo(idConteoEfectivo)

  // Mutaciones
  const iniciarMutation = useIniciarConteo()
  const guardarMutation = useGuardarItemsConteo()
  const calcularMutation = useCalcularDiferencias()
  const cerrarMutation = useCerrarConteo()
  const ajustarMutation = useAjustarStockConteo()

  // Mapa local para edición en tiempo real de conteos físicos
  const [cambiosLocales, setCambiosLocales] = useState<Record<number, string>>({})
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  const hayCambiosLocales = Object.keys(cambiosLocales).length > 0

  const manejarCambioFisico = (productoId: number, valor: string) => {
    // Solo permitir números enteros positivos o vacío (RN-08)
    if (valor === '' || /^\d+$/.test(valor)) {
      setCambiosLocales((prev) => ({ ...prev, [productoId]: valor }))
    }
  }

  const obtenerValorFisico = (det: DetalleConteo): string => {
    if (cambiosLocales[det.producto_id] !== undefined) {
      return cambiosLocales[det.producto_id]
    }
    return det.stock_fisico !== null && det.stock_fisico !== undefined
      ? String(det.stock_fisico)
      : ''
  }

  const seleccionarSesion = (id: number) => {
    setIdConteoSeleccionado(id)
    setCambiosLocales({})
  }

  const guardarBorrador = async () => {
    if (!idConteoEfectivo || !conteoActual) return
    const items: ItemConteoInput[] = []
    conteoActual.detalles.forEach((d) => {
      const valStr = obtenerValorFisico(d)
      if (valStr !== '') {
        items.push({
          producto_id: d.producto_id,
          stock_fisico: parseInt(valStr, 10),
        })
      }
    })

    if (items.length === 0) return

    await guardarMutation.mutateAsync({ id: idConteoEfectivo, items })
    setCambiosLocales({})
    mostrarToast('Conteos guardados en borrador con éxito.')
  }

  const calcularDiferencias = async () => {
    if (!idConteoEfectivo) return
    // Guardar primero si hay cambios pendientes
    if (hayCambiosLocales) {
      await guardarBorrador()
    }
    await calcularMutation.mutateAsync(idConteoEfectivo)
    mostrarToast('Diferencias y semáforo calculados correctamente.')
  }

  const cerrarConteo = async () => {
    if (!idConteoEfectivo) return
    if (hayCambiosLocales) {
      await guardarBorrador()
    }
    await cerrarMutation.mutateAsync(idConteoEfectivo)
    mostrarToast('Sesión de conteo cerrada y consolidada para auditoría.')
  }

  const aplicarAjusteStock = async (motivo: string) => {
    if (!idConteoEfectivo) return
    const res = await ajustarMutation.mutateAsync({
      id: idConteoEfectivo,
      motivo,
    })
    mostrarToast(res.mensaje)
  }

  const mostrarToast = (msg: string) => {
    setMensajeExito(msg)
    setTimeout(() => setMensajeExito(null), 4000)
  }

  const esBorrador = conteoActual?.estado === 'borrador'

  // Filtrado de detalles en la tabla
  const detallesFiltrados = (conteoActual?.detalles || []).filter((det: DetalleConteo) => {
    const coincideTexto =
      det.producto_sku.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      det.producto_nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      det.categoria_nombre.toLowerCase().includes(terminoBusqueda.toLowerCase())

    if (!coincideTexto) return false

    if (filtroConformidad === 'conformes') return det.conforme === true
    if (filtroConformidad === 'desviacion') return det.conforme === false
    if (filtroConformidad === 'pendientes') return det.conforme === null

    return true
  })

  // Cantidad de productos con desviación pendientes de ajuste
  const productosParaAjustar = (conteoActual?.detalles || []).filter(
    (d) => d.conforme === false && !d.ajustado && d.stock_fisico !== null
  ).length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {mensajeExito && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg bg-emerald-800 text-white shadow-lg border border-emerald-700 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span className="text-xs font-medium">{mensajeExito}</span>
        </div>
      )}

      {/* Header de la Pantalla */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-blue-100 text-blue-900 border border-blue-200">
              Control de Calidad · RNF-02
            </span>
            <span className="text-xs font-mono text-slate-500">Módulo P-07</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Conciliación de Stock y Conteo Físico
          </h1>
          <p className="text-xs text-slate-600">
            Comparación entre inventario del sistema y existencias físicas reales con umbral de
            tolerancia del 2%.
          </p>
        </div>

        {puedeOperar && (
          <button
            onClick={() => setModalIniciarAbierto(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nuevo Conteo Físico
          </button>
        )}
      </div>

      {/* Selector de Sesión de Conteo & Historial Rápido */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <History className="w-3.5 h-3.5 text-blue-800" /> Sesiones:
        </span>
        {cargandoLista ? (
          <span className="text-xs text-slate-400">Cargando sesiones...</span>
        ) : listaConteos.length === 0 ? (
          <span className="text-xs text-slate-500 italic">No hay conteos registrados aún.</span>
        ) : (
          listaConteos.map((c) => {
            const activo = c.id === idConteoEfectivo
            return (
              <button
                key={c.id}
                onClick={() => seleccionarSesion(c.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                  activo
                    ? 'bg-blue-800 text-white border-blue-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Conteo #{c.id}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase ${
                    c.estado === 'borrador'
                      ? activo
                        ? 'bg-amber-400/30 text-amber-100'
                        : 'bg-amber-100 text-amber-800'
                      : activo
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {c.estado}
                </span>
                <span className="font-mono text-[11px] tabular-nums">
                  {Number(c.porcentaje_conformidad).toFixed(1)}%
                </span>
              </button>
            )
          })
        )}
      </div>

      {/* Panel Principal del Conteo Seleccionado */}
      {cargandoConteo ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <Scale className="w-8 h-8 animate-bounce mx-auto text-blue-800 mb-2" />
          <p className="text-xs font-medium">Cargando datos del conteo físico...</p>
        </div>
      ) : !conteoActual ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No hay conteo seleccionado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Inicia un nuevo conteo físico para capturar el stock del almacén o selecciona una sesión
            existente.
          </p>
          {puedeOperar && (
            <button
              onClick={() => setModalIniciarAbierto(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Iniciar Primer Conteo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card de Resumen de la Sesión y Semáforo Global */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold text-slate-900">
                    Sesión de Conteo #{conteoActual.id}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      conteoActual.estado === 'borrador'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {conteoActual.estado === 'borrador' ? (
                      <Clock className="w-3 h-3" />
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                    {conteoActual.estado}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Iniciado el {formatearFecha(conteoActual.fecha)} por{' '}
                  <span className="font-semibold text-slate-700">
                    {conteoActual.responsable_nombre}
                  </span>
                  {conteoActual.observaciones && ` · "${conteoActual.observaciones}"`}
                </p>
              </div>

              {/* Botonera de Acción de la Sesión */}
              <div className="flex items-center gap-2 flex-wrap">
                {esBorrador && (
                  <>
                    <button
                      onClick={guardarBorrador}
                      disabled={guardarMutation.isPending || !hayCambiosLocales}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors shadow-xs"
                      title="Guarda las cantidades digitadas sin cerrar"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      {hayCambiosLocales ? 'Guardar Cambios' : 'Guardado'}
                    </button>

                    <button
                      onClick={calcularDiferencias}
                      disabled={calcularMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-800 hover:bg-blue-900 text-white shadow-xs transition-colors"
                      title="Calcula % de diferencia y aplica el semáforo (RN-06)"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      Calcular Diferencias
                    </button>

                    <button
                      onClick={cerrarConteo}
                      disabled={cerrarMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-xs transition-colors"
                      title="Cierra el conteo y lo consolida para auditoría"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Cerrar Conteo
                    </button>
                  </>
                )}

                {/* Acción de Ajuste de Stock (Exclusivo Administrador) */}
                {esAdmin && productosParaAjustar > 0 && (
                  <button
                    onClick={() => setModalAjustarAbierto(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Ajustar Stock ({productosParaAjustar})
                  </button>
                )}
              </div>
            </div>

            {/* Fila de KPIs de Conformidad */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-white">
              <div className="p-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Productos Evaluados
                </span>
                <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                  {conteoActual.total_items}
                </span>
              </div>

              <div className="p-4">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Conformes (≤ 2%)
                </span>
                <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
                  {conteoActual.items_conformes}
                </span>
              </div>

              <div className="p-4">
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-600" /> Desviaciones (&gt; 2%)
                </span>
                <span className="text-xl font-bold font-mono text-rose-700 tabular-nums">
                  {conteoActual.items_no_conformes}
                </span>
              </div>

              <div className="p-4 bg-slate-50/40">
                <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-700" /> % Conformidad Global
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-blue-950 tabular-nums">
                    {Number(conteoActual.porcentaje_conformidad).toFixed(2)}%
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {Number(conteoActual.porcentaje_conformidad) >= 95 ? (
                      <span className="text-emerald-700 font-semibold">Excelente</span>
                    ) : (
                      <span className="text-amber-700 font-semibold">Revisar Desvíos</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Búsqueda y Filtros de la Tabla */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por SKU, producto o categoría..."
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-700 bg-white"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg self-start sm:self-auto text-xs font-medium text-slate-700">
              <button
                onClick={() => setFiltroConformidad('todos')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filtroConformidad === 'todos' ? 'bg-white shadow-xs font-semibold text-blue-950' : 'hover:text-slate-900'
                }`}
              >
                Todos ({conteoActual.detalles.length})
              </button>
              <button
                onClick={() => setFiltroConformidad('conformes')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filtroConformidad === 'conformes'
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'hover:text-emerald-800'
                }`}
              >
                Conformes ({conteoActual.items_conformes})
              </button>
              <button
                onClick={() => setFiltroConformidad('desviacion')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filtroConformidad === 'desviacion'
                    ? 'bg-rose-700 text-white shadow-xs font-semibold'
                    : 'hover:text-rose-800'
                }`}
              >
                Con Desviación ({conteoActual.items_no_conformes})
              </button>
              <button
                onClick={() => setFiltroConformidad('pendientes')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filtroConformidad === 'pendientes'
                    ? 'bg-slate-700 text-white shadow-xs font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                Pendientes
              </button>
            </div>
          </div>

          {/* Tabla de Conteo Físico */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Producto Textil</th>
                    <th className="py-3 px-4">Categoría / Unidad</th>
                    <th className="py-3 px-4 text-right">
                      Stock Sistema <span className="text-[10px] text-slate-400 block font-normal">(Captura)</span>
                    </th>
                    <th className="py-3 px-4 text-center w-36">
                      Conteo Físico <span className="text-[10px] text-blue-700 block font-normal">(Almacén)</span>
                    </th>
                    <th className="py-3 px-4 text-right">Diferencia</th>
                    <th className="py-3 px-4 text-center">Estado Semáforo</th>
                    <th className="py-3 px-4 text-center">Ajuste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detallesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                        No se encontraron productos que coincidan con los filtros.
                      </td>
                    </tr>
                  ) : (
                    detallesFiltrados.map((det) => {
                      const valorInput = obtenerValorFisico(det)
                      const diffUnidades = det.diferencia

                      return (
                        <tr
                          key={det.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            det.conforme === false ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {det.producto_sku}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {det.producto_nombre}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            <span>{det.categoria_nombre}</span>
                            <span className="block text-[11px] text-slate-400 capitalize">
                              Por {det.unidad}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 tabular-nums">
                            {det.stock_sistema}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {esBorrador ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={valorInput}
                                onChange={(e) =>
                                  manejarCambioFisico(det.producto_id, e.target.value)
                                }
                                placeholder="0"
                                className="w-24 text-center font-mono font-bold text-sm px-2 py-1 rounded border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-700 bg-white"
                              />
                            ) : (
                              <span className="font-mono font-bold text-sm text-slate-900">
                                {det.stock_fisico ?? '-'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            {diffUnidades !== null && diffUnidades !== undefined ? (
                              <span
                                className={`font-semibold ${
                                  diffUnidades === 0
                                    ? 'text-slate-500'
                                    : diffUnidades > 0
                                      ? 'text-amber-700'
                                      : 'text-rose-700'
                                }`}
                              >
                                {diffUnidades > 0 ? `+${diffUnidades}` : diffUnidades}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <SemaforoIndicador
                              conforme={det.conforme}
                              porcentaje={det.porcentaje_diferencia}
                              diferencia={det.diferencia}
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            {det.ajustado ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                <CheckCircle2 className="w-3 h-3 text-blue-600" /> Ajustado
                              </span>
                            ) : det.conforme === false && det.stock_fisico !== null ? (
                              <span className="text-[11px] text-amber-700 font-medium italic">
                                Pendiente
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <IniciarConteoModal
        abierto={modalIniciarAbierto}
        onCerrar={() => setModalIniciarAbierto(false)}
        onConfirmar={async (obs) => {
          const res = await iniciarMutation.mutateAsync(obs)
          seleccionarSesion(res.id)
          mostrarToast(`Nuevo conteo #${res.id} iniciado con éxito.`)
        }}
        estaCargando={iniciarMutation.isPending}
      />

      <AjustarStockModal
        abierto={modalAjustarAbierto}
        onCerrar={() => setModalAjustarAbierto(false)}
        onConfirmar={aplicarAjusteStock}
        estaCargando={ajustarMutation.isPending}
        cantidadProductos={productosParaAjustar}
      />
    </div>
  )
}
