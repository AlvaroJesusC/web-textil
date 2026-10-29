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
import { Header } from '@/components/layout/Header'
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
    mostrarToast('Sesión de conteo consolidada para auditoría.')
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
    <div className="flex-1 flex flex-col bg-[#F9F8F5]">
      <Header
        titulo="Conciliación de Stock y Auditoría Física"
        subtitulo="Verificación de existencias reales en almacén con tolerancia de control del 2%"
      />

      <main className="p-6 space-y-5">
        {/* Toast Notification */}
        {mensajeExito && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#1B2A4A] text-white shadow-lg border border-white/15 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Barra superior de herramientas y Selector de Sesiones */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E3DC] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <History className="w-3.5 h-3.5 text-[#2452E8]" /> Sesiones:
            </span>
            {cargandoLista ? (
              <span className="text-xs text-slate-400 font-medium">Cargando...</span>
            ) : listaConteos.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No hay conteos registrados.</span>
            ) : (
              listaConteos.map((c) => {
                const activo = c.id === idConteoEfectivo
                return (
                  <button
                    key={c.id}
                    onClick={() => seleccionarSesion(c.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 cursor-pointer ${
                      activo
                        ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs'
                        : 'bg-[#F9F8F5] text-[#1B2A4A] border-[#E6E3DC] hover:bg-[#F2F0EA]'
                    }`}
                  >
                    <span>#{c.id}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        c.estado === 'borrador'
                          ? activo
                            ? 'bg-[#D95D39] text-white'
                            : 'bg-[#FEF3C7] text-[#B45309]'
                          : activo
                            ? 'bg-white/20 text-white'
                            : 'bg-[#F2F0EA] text-slate-600'
                      }`}
                    >
                      {c.estado}
                    </span>
                    <span className="text-[11px] tabular-nums">
                      {Number(c.porcentaje_conformidad).toFixed(1)}%
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {puedeOperar && (
            <button
              onClick={() => setModalIniciarAbierto(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#D95D39] hover:bg-[#C24D2B] rounded-lg shadow-sm transition-all shrink-0 self-end md:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Conteo Físico</span>
            </button>
          )}
        </div>

        {/* Panel Principal del Conteo Seleccionado */}
        {cargandoConteo ? (
          <div className="bg-white rounded-xl border border-[#E6E3DC] p-12 text-center text-slate-500 shadow-sm">
            <Scale className="w-8 h-8 mx-auto text-[#2452E8] mb-2 animate-pulse" />
            <p className="text-xs font-semibold text-[#1B2A4A]">Cargando auditoría física...</p>
          </div>
        ) : !conteoActual ? (
          <div className="bg-white rounded-xl border border-dashed border-[#E6E3DC] p-12 text-center shadow-sm">
            <Layers className="w-9 h-9 text-slate-400 mx-auto mb-2.5" />
            <h3 className="text-xs font-extrabold text-[#1B2A4A] uppercase tracking-wider">
              No hay sesión de conteo seleccionada
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Inicie un nuevo conteo físico para capturar el stock del almacén o seleccione una sesión existente.
            </p>
            {puedeOperar && (
              <button
                onClick={() => setModalIniciarAbierto(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#D95D39] hover:bg-[#C24D2B] rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Iniciar Primer Conteo</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Tarjeta de Resumen de la Sesión y Semáforo Global */}
            <div className="bg-white rounded-xl border border-[#E6E3DC] shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[#E6E3DC] bg-[#F2F0EA]/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-extrabold text-[#1B2A4A]">
                      Sesión de Conteo #{conteoActual.id}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase ${
                        conteoActual.estado === 'borrador'
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : 'bg-[#DCFCE7] text-[#15803D]'
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
                    Fecha de corte: {formatearFecha(conteoActual.fecha)} · Responsable:{' '}
                    <span className="font-bold text-[#1B2A4A]">
                      {conteoActual.responsable_nombre}
                    </span>
                    {conteoActual.observaciones && ` · "${conteoActual.observaciones}"`}
                  </p>
                </div>

                {/* Botonera de Acción */}
                <div className="flex items-center gap-2 flex-wrap">
                  {esBorrador && puedeOperar && (
                    <>
                      <button
                        onClick={guardarBorrador}
                        disabled={guardarMutation.isPending || !hayCambiosLocales}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border border-[#E6E3DC] bg-white hover:bg-[#F9F8F5] text-[#1B2A4A] disabled:opacity-40 transition-all cursor-pointer"
                        title="Guarda las cantidades digitadas en borrador"
                      >
                        <Save className="w-3.5 h-3.5 text-[#2452E8]" />
                        <span>{hayCambiosLocales ? 'Guardar Cambios' : 'Guardado'}</span>
                      </button>

                      <button
                        onClick={calcularDiferencias}
                        disabled={calcularMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#2452E8] hover:bg-[#1E44C8] text-white shadow-sm transition-all cursor-pointer"
                        title="Calcula % de diferencia y aplica el semáforo al 2%"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Calcular Semáforo</span>
                      </button>

                      <button
                        onClick={cerrarConteo}
                        disabled={cerrarMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#1B2A4A] hover:bg-[#243861] text-white shadow-sm transition-all cursor-pointer"
                        title="Cierra el conteo y consolida auditoría"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Cerrar Conteo</span>
                      </button>
                    </>
                  )}

                  {/* Acción de Ajuste de Stock */}
                  {esAdmin && productosParaAjustar > 0 && (
                    <button
                      onClick={() => setModalAjustarAbierto(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#D95D39] hover:bg-[#C24D2B] text-white shadow-sm transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Ajustar Stock ({productosParaAjustar})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Fila de Indicadores de Conformidad con números grandes en Plus Jakarta Sans */}
              <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E6E3DC]/60 bg-white">
                <div className="p-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Evaluados
                  </span>
                  <span className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums mt-0.5 block">
                    {conteoActual.total_items}
                  </span>
                </div>

                <div className="p-4">
                  <span className="text-[11px] font-bold text-[#15803D] uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" /> Conformes (≤ 2%)
                  </span>
                  <span className="text-2xl font-extrabold text-[#15803D] tracking-tight tabular-nums mt-0.5 block">
                    {conteoActual.items_conformes}
                  </span>
                </div>

                <div className="p-4">
                  <span className="text-[11px] font-bold text-[#DC2626] uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" /> Desviación (&gt; 2%)
                  </span>
                  <span className="text-2xl font-extrabold text-[#B91C1C] tracking-tight tabular-nums mt-0.5 block">
                    {conteoActual.items_no_conformes}
                  </span>
                </div>

                <div className="p-4 bg-[#F9F8F5]/60">
                  <span className="text-[11px] font-bold text-[#2452E8] uppercase tracking-wider block">
                    Conformidad Global
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">
                      {Number(conteoActual.porcentaje_conformidad).toFixed(2)}%
                    </span>
                    <span className="text-[11px]">
                      {Number(conteoActual.porcentaje_conformidad) >= 95 ? (
                        <span className="text-[#15803D] font-bold">Óptimo</span>
                      ) : (
                        <span className="text-[#D95D39] font-bold">Revisar Desvíos</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#2452E8] absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por SKU, producto o categoría..."
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-[#E6E3DC] focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none bg-white text-[#1B2A4A] transition-all"
                />
              </div>

              <div className="flex items-center gap-1 bg-white border border-[#E6E3DC] p-1 rounded-xl self-start sm:self-auto text-xs font-semibold text-[#1B2A4A] shadow-2xs">
                <button
                  onClick={() => setFiltroConformidad('todos')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filtroConformidad === 'todos'
                      ? 'bg-[#1B2A4A] font-bold text-white'
                      : 'hover:bg-[#F9F8F5]'
                  }`}
                >
                  Todos ({conteoActual.detalles.length})
                </button>
                <button
                  onClick={() => setFiltroConformidad('conformes')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filtroConformidad === 'conformes'
                      ? 'bg-[#15803D] text-white font-bold'
                      : 'hover:bg-[#DCFCE7]/50 text-[#15803D]'
                  }`}
                >
                  Conformes ({conteoActual.items_conformes})
                </button>
                <button
                  onClick={() => setFiltroConformidad('desviacion')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filtroConformidad === 'desviacion'
                      ? 'bg-[#DC2626] text-white font-bold'
                      : 'hover:bg-[#FEE2E2]/50 text-[#B91C1C]'
                  }`}
                >
                  Desviación ({conteoActual.items_no_conformes})
                </button>
                <button
                  onClick={() => setFiltroConformidad('pendientes')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filtroConformidad === 'pendientes'
                      ? 'bg-[#1B2A4A] text-white font-bold'
                      : 'hover:bg-[#F9F8F5]'
                  }`}
                >
                  Pendientes
                </button>
              </div>
            </div>

            {/* Tabla Comparativa de Conteo Físico */}
            <div className="bg-white rounded-xl border border-[#E6E3DC] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F2F0EA] border-b border-[#E6E3DC] text-[#1B2A4A] font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 w-28 whitespace-nowrap">SKU</th>
                      <th className="py-3 px-4 whitespace-nowrap">Artículo Textil</th>
                      <th className="py-3 px-4 whitespace-nowrap">Familia / Unidad</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Stock Sistema (Captura)</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Conteo Físico</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Diferencia</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Semáforo (≤ 2%)</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Ajuste</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E3DC]/60">
                    {detallesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400 italic text-xs">
                          No se encontraron artículos que coincidan con los filtros.
                        </td>
                      </tr>
                    ) : (
                      detallesFiltrados.map((det) => {
                        const valorInput = obtenerValorFisico(det)
                        const diffUnidades = det.diferencia

                        return (
                          <tr
                            key={det.id}
                            className={`hover:bg-[#F9F8F5] transition-colors h-11 ${
                              det.conforme === false ? 'bg-[#FEE2E2]/25' : ''
                            }`}
                          >
                            <td className="py-2.5 px-4 font-mono font-semibold text-[#1B2A4A] text-xs">
                              {det.producto_sku}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-[#1B2A4A]">
                              {det.producto_nombre}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">
                              <span className="font-medium text-[#1B2A4A]">
                                {det.categoria_nombre}
                              </span>
                              <span className="block text-[11px] text-slate-500 capitalize">
                                Por {det.unidad}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-[#1B2A4A] tabular-nums">
                              {det.stock_sistema}
                            </td>
                            <td className="py-2 px-4 text-center">
                              {esBorrador && puedeOperar ? (
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={valorInput}
                                  onChange={(e) =>
                                    manejarCambioFisico(det.producto_id, e.target.value)
                                  }
                                  placeholder="0"
                                  className="w-20 text-center font-bold text-xs px-2.5 py-1.5 rounded-lg border border-[#E6E3DC] focus:border-[#2452E8] focus:ring-2 focus:ring-[#2452E8]/20 focus:outline-none bg-white text-[#1B2A4A] tabular-nums transition-all"
                                />
                              ) : (
                                <span className="font-bold text-xs text-[#1B2A4A] tabular-nums">
                                  {det.stock_fisico ?? '-'}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-xs">
                              {diffUnidades !== null && diffUnidades !== undefined ? (
                                <span
                                  className={`font-bold ${
                                    diffUnidades === 0
                                      ? 'text-slate-500'
                                      : diffUnidades > 0
                                        ? 'text-[#D97706]'
                                        : 'text-[#DC2626]'
                                  }`}
                                >
                                  {diffUnidades > 0 ? `+${diffUnidades}` : diffUnidades}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <SemaforoIndicador
                                conforme={det.conforme}
                                porcentaje={det.porcentaje_diferencia}
                                diferencia={det.diferencia}
                              />
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {det.ajustado ? (
                                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#2452E8]/10 text-[#2452E8]">
                                  Sincronizado
                                </span>
                              ) : det.conforme === false && det.stock_fisico !== null ? (
                                <span className="text-[11px] text-[#D95D39] font-bold">
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
      </main>

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
