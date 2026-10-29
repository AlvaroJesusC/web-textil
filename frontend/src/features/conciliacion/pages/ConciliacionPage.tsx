import React, { useState } from 'react'
import {
  Scale,
  Plus,
  Calculator,
  Save,
  Lock,
  Search,
  CheckCircle2,
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

  const { data: listaConteos = [], isLoading: cargandoLista } = useConteos()
  const idConteoEfectivo =
    idConteoSeleccionado ??
    (listaConteos.find((c) => c.estado === 'borrador')?.id ?? listaConteos[0]?.id ?? null)
  const { data: conteoActual, isLoading: cargandoConteo } = useConteo(idConteoEfectivo)

  const iniciarMutation = useIniciarConteo()
  const guardarMutation = useGuardarItemsConteo()
  const calcularMutation = useCalcularDiferencias()
  const cerrarMutation = useCerrarConteo()
  const ajustarMutation = useAjustarStockConteo()

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
    mostrarToast('Conteos físicos guardados en el acta actual.')
  }

  const calcularDiferencias = async () => {
    if (!idConteoEfectivo) return
    if (hayCambiosLocales) {
      await guardarBorrador()
    }
    await calcularMutation.mutateAsync(idConteoEfectivo)
    mostrarToast('Tolerancia del 2% evaluada sobre todos los artículos.')
  }

  const cerrarConteo = async () => {
    if (!idConteoEfectivo) return
    if (hayCambiosLocales) {
      await guardarBorrador()
    }
    await cerrarMutation.mutateAsync(idConteoEfectivo)
    mostrarToast('Acta de conteo físico consolidada y cerrada.')
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

  const productosParaAjustar = (conteoActual?.detalles || []).filter(
    (d) => d.conforme === false && !d.ajustado && d.stock_fisico !== null
  ).length

  const pctGlobal = conteoActual ? Number(conteoActual.porcentaje_conformidad) : 0

  return (
    <div className="flex-1 flex flex-col">
      <Header
        titulo="Auditoría Física de Almacén (Regla del 2%)"
        subtitulo="Contraste entre existencias del sistema y conteo en estantería con semáforo de conformidad"
      />

      <main className="p-6 space-y-5">
        {mensajeExito && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl sidebar-textil text-white shadow-xl border border-white/15 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Selector de Actas de Conteo y Botón de Nueva Captura */}
        <div className="card-textil p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 shrink-0 mr-1">
              <History className="w-3.5 h-3.5 text-[#2452E8]" /> Actas registradas:
            </span>
            {cargandoLista ? (
              <span className="text-xs text-slate-400 font-medium">Cargando actas...</span>
            ) : listaConteos.length === 0 ? (
              <span className="text-xs text-slate-400">Sin auditorías previas.</span>
            ) : (
              listaConteos.map((c) => {
                const activo = c.id === idConteoEfectivo
                const enCurso = c.estado === 'borrador'
                return (
                  <button
                    key={c.id}
                    onClick={() => seleccionarSesion(c.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 ${
                      activo
                        ? 'btn-indigo font-bold'
                        : 'btn-superficie text-[#1B2A4A]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        enCurso ? 'bg-[#D95D39]' : 'bg-emerald-400'
                      }`}
                    />
                    <span>Acta #{c.id}</span>
                    <span className="opacity-75 text-[11px] tabular-nums">
                      ({Number(c.porcentaje_conformidad).toFixed(0)}%)
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {puedeOperar && (
            <button
              onClick={() => setModalIniciarAbierto(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl btn-terracota shrink-0 self-end md:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nueva Captura de Almacén</span>
            </button>
          )}
        </div>

        {/* Cuerpo del Acta Seleccionada */}
        {cargandoConteo ? (
          <div className="card-textil rounded-2xl p-12 text-center text-slate-500">
            <Scale className="w-8 h-8 mx-auto text-[#2452E8] mb-2 animate-pulse" />
            <p className="text-xs font-semibold text-[#1B2A4A]">Cargando hoja de conteo...</p>
          </div>
        ) : !conteoActual ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#DDD8CC] p-12 text-center shadow-sm">
            <Layers className="w-9 h-9 text-slate-400 mx-auto mb-2.5" />
            <h3 className="text-sm font-extrabold text-[#1B2A4A]">
              Ninguna sesión de conteo activa
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Inicie una captura para congelar el saldo actual del sistema y contrastarlo contra el conteo físico de rollos y conos.
            </p>
            {puedeOperar && (
              <button
                onClick={() => setModalIniciarAbierto(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl btn-terracota"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Iniciar Primera Auditoría</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Ficha de Cabecera del Acta y Progreso de Exactitud */}
            <div className="card-textil rounded-2xl border-t-[3px] border-t-[#1B2A4A] overflow-hidden">
              <div className="p-5 border-b border-[#E5E0D5] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-extrabold text-[#1B2A4A]">
                      Acta de Conteo Físico #{conteoActual.id}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        esBorrador
                          ? 'bg-[#FEF3C7] text-[#B45309] border-[#D97706]/30'
                          : 'bg-[#DCFCE7] text-[#15803D] border-[#15803D]/25'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          esBorrador ? 'bg-[#D97706]' : 'bg-[#15803D]'
                        }`}
                      />
                      {esBorrador ? 'En captura abierta' : 'Acta cerrada'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Corte de inventario: <span className="tabular-nums">{formatearFecha(conteoActual.fecha)}</span> · Auditor responsable:{' '}
                    <strong className="text-[#1B2A4A]">{conteoActual.responsable_nombre}</strong>
                    {conteoActual.observaciones && ` · Nota: "${conteoActual.observaciones}"`}
                  </p>
                </div>

                {/* Botones de Flujo de Auditoría con Relieve */}
                <div className="flex items-center gap-2 flex-wrap">
                  {esBorrador && puedeOperar && (
                    <>
                      <button
                        onClick={guardarBorrador}
                        disabled={guardarMutation.isPending || !hayCambiosLocales}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold btn-superficie"
                      >
                        <Save className="w-3.5 h-3.5 text-[#2452E8]" />
                        <span>{hayCambiosLocales ? 'Guardar Avance' : 'Avance guardado'}</span>
                      </button>

                      <button
                        onClick={calcularDiferencias}
                        disabled={calcularMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold btn-cobalto"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Evaluar Semáforo (2%)</span>
                      </button>

                      <button
                        onClick={cerrarConteo}
                        disabled={cerrarMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold btn-indigo"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Cerrar Acta</span>
                      </button>
                    </>
                  )}

                  {esAdmin && productosParaAjustar > 0 && (
                    <button
                      onClick={() => setModalAjustarAbierto(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold btn-terracota"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Sincronizar Kardex ({productosParaAjustar})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Resumen de Exactitud y Barra de Tolerancia */}
              <div className="p-5 bg-[#FAF9F6] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="grid grid-cols-3 gap-6 flex-1">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">
                      Referencias en acta
                    </span>
                    <span className="text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums mt-0.5 block">
                      {conteoActual.total_items} SKUs
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-[#15803D] block">
                      Dentro de tolerancia (≤ 2%)
                    </span>
                    <span className="text-2xl font-extrabold text-[#15803D] tracking-tight tabular-nums mt-0.5 block">
                      {conteoActual.items_conformes} conformes
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-[#B91C1C] block">
                      Descuadre crítico (&gt; 2%)
                    </span>
                    <span className="text-2xl font-extrabold text-[#B91C1C] tracking-tight tabular-nums mt-0.5 block">
                      {conteoActual.items_no_conformes} observados
                    </span>
                  </div>
                </div>

                {/* Indicador de Exactitud Global con Barra */}
                <div className="lg:w-72 bg-white p-3.5 rounded-xl border border-[#E5E0D5] shadow-xs">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-[#1B2A4A]">
                      Exactitud de inventario
                    </span>
                    <span className="text-lg font-extrabold text-[#1B2A4A] tabular-nums">
                      {pctGlobal.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full bg-[#ECE8DF] rounded-full overflow-hidden shadow-inner">
                    <div
                      style={{ width: `${Math.min(100, pctGlobal)}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        pctGlobal >= 95 ? 'bg-[#15803D]' : 'bg-[#D95D39]'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    {pctGlobal >= 95
                      ? 'Nivel óptimo según norma interna (≤ 2% merma).'
                      : 'Existen diferencias que requieren revisión o ajuste.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Filtros de Hoja de Conteo */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#2452E8] absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar hoja por SKU, nombre de tela o categoría..."
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl input-textil"
                />
              </div>

              <div className="inline-flex items-center gap-1 pista-segmentos p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
                <button
                  onClick={() => setFiltroConformidad('todos')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filtroConformidad === 'todos'
                      ? 'btn-indigo font-bold'
                      : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-white/60'
                  }`}
                >
                  Todos ({conteoActual.detalles.length})
                </button>
                <button
                  onClick={() => setFiltroConformidad('conformes')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filtroConformidad === 'conformes'
                      ? 'bg-[#15803D] text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-[#15803D] hover:bg-white/60'
                  }`}
                >
                  Conformes ({conteoActual.items_conformes})
                </button>
                <button
                  onClick={() => setFiltroConformidad('desviacion')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filtroConformidad === 'desviacion'
                      ? 'bg-[#DC2626] text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-[#B91C1C] hover:bg-white/60'
                  }`}
                >
                  Con descuadre ({conteoActual.items_no_conformes})
                </button>
                <button
                  onClick={() => setFiltroConformidad('pendientes')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filtroConformidad === 'pendientes'
                      ? 'btn-indigo font-bold'
                      : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-white/60'
                  }`}
                >
                  Sin contar
                </button>
              </div>
            </div>

            {/* Tabla Comparativa de Conteo Físico */}
            <div className="card-textil rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gradient-to-b from-[#F5F3EE] to-[#ECE8DF] border-b border-[#DED9CE] text-[#1B2A4A] font-bold text-[11px]">
                      <th className="py-3.5 px-4 w-28 whitespace-nowrap">Código SKU</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Artículo Textil</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Familia / Unidad</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Saldo Sistema</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Conteo Físico</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Variación</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Evaluación (≤ 2%)</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Estado Kardex</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D5]/70">
                    {detallesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                          No hay artículos que coincidan con el filtro seleccionado.
                        </td>
                      </tr>
                    ) : (
                      detallesFiltrados.map((det) => {
                        const valorInput = obtenerValorFisico(det)
                        const diffUnidades = det.diferencia

                        return (
                          <tr
                            key={det.id}
                            className={`group fila-interactiva h-12 ${
                              det.conforme === false ? 'bg-[#FEE2E2]/20' : ''
                            }`}
                          >
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              <span className="font-mono font-bold text-[#1B2A4A] bg-[#F2F0EA] group-hover:bg-[#1B2A4A] group-hover:text-white px-2 py-0.5 rounded-md transition-colors text-xs">
                                {det.producto_sku}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-bold text-[#1B2A4A] group-hover:text-[#2452E8] transition-colors">
                              {det.producto_nombre}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                              <span className="font-medium text-[#1B2A4A]">
                                {det.categoria_nombre}
                              </span>
                              <span className="text-slate-400"> · {det.unidad}s</span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-[#1B2A4A] tabular-nums whitespace-nowrap">
                              {det.stock_sistema} {det.unidad}s
                            </td>
                            <td className="py-2 px-4 text-center whitespace-nowrap">
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
                                  aria-label={`Conteo físico de ${det.producto_nombre}`}
                                  className="w-20 text-center font-bold text-xs px-2.5 py-1.5 rounded-xl input-textil tabular-nums"
                                />
                              ) : (
                                <span className="font-bold text-xs text-[#1B2A4A] tabular-nums">
                                  {det.stock_fisico !== null ? `${det.stock_fisico} ${det.unidad}s` : '-'}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-xs whitespace-nowrap">
                              {diffUnidades !== null && diffUnidades !== undefined ? (
                                <span
                                  className={`font-bold ${
                                    diffUnidades === 0
                                      ? 'text-slate-400'
                                      : diffUnidades > 0
                                        ? 'text-[#D97706]'
                                        : 'text-[#DC2626]'
                                  }`}
                                >
                                  {diffUnidades > 0 ? `+${diffUnidades}` : diffUnidades}{' '}
                                  {det.unidad}s
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center whitespace-nowrap">
                              <SemaforoIndicador
                                conforme={det.conforme}
                                porcentaje={det.porcentaje_diferencia}
                                diferencia={det.diferencia}
                              />
                            </td>
                            <td className="py-2.5 px-4 text-center whitespace-nowrap">
                              {det.ajustado ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2452E8]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Ajustado
                                </span>
                              ) : det.conforme === false && det.stock_fisico !== null ? (
                                <span className="text-[11px] text-[#D95D39] font-bold">
                                  Requiere ajuste
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
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

      <IniciarConteoModal
        abierto={modalIniciarAbierto}
        onCerrar={() => setModalIniciarAbierto(false)}
        onConfirmar={async (obs) => {
          const res = await iniciarMutation.mutateAsync(obs)
          seleccionarSesion(res.id)
          mostrarToast(`Acta de conteo #${res.id} creada y lista para registro.`)
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
