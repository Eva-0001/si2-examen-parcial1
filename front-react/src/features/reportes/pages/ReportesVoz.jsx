import { useCallback, useEffect, useRef, useState } from 'react'
import { EJEMPLOS, EJEMPLOS_IA, EJEMPLOS_IA_SUCURSAL, armarReporte, reporteDesdeIa } from '../reportes.utils'
import { reportesIaService } from '../services/reportes-ia.service'
import { tableroService } from '@/features/tablero/services/tablero.service'
import { useAuth } from '@/core/stores/auth.store'
import { useReferencias } from '@/core/stores/referencias.store'
import { toast } from '@/core/stores/toast.store'
import GraficoBarras from '@/shared/components/GraficoBarras'
import GraficoLineas from '@/shared/components/GraficoLineas'
import { crearReconocimiento, descargarCsv } from '@/shared/utils/voz'
import { hoyISO } from '@/shared/utils/fechas'
import { cx } from '@/shared/utils/clases'

export default function ReportesVoz() {
  const referencias = useReferencias()
  const { esAdmin, esEncargado, esCajero } = useAuth()
  const deSucursal = esEncargado || esCajero
  const modoSinIa = esAdmin ? 'local' : 'sin-ia'

  const [modo, setModo] = useState('verificando')

  const [error, setError] = useState(null)
  const [datos, setDatos] = useState(null)
  const cargando = modo === 'local' && !datos && !error
  const [tipoReporte, setTipoReporte] = useState(null)

  const [reporteIa, setReporteIa] = useState(null)

  const [pregunta, setPregunta] = useState('')
  const [escuchando, setEscuchando] = useState(false)
  const [transcripcion, setTranscripcion] = useState('')
  const [generando, setGenerando] = useState(false)

  const reconocimiento = useRef(null)
  const temporizador = useRef(null)
  const ultimoPedido = useRef(0)

  const reporte =
    modo === 'ia' ? reporteIa : tipoReporte && datos ? armarReporte(tipoReporte, datos, referencias.nombre) : null

  useEffect(() => {
    let vigente = true
    reportesIaService
      .estado()
      .then((e) => vigente && setModo(e.habilitado ? 'ia' : modoSinIa))
      .catch(() => vigente && setModo(modoSinIa))
    return () => {
      vigente = false
      clearTimeout(temporizador.current)
    }
  }, [modoSinIa])

  useEffect(() => {
    if (modo !== 'local') return
    tableroService
      .cargar()
      .then(setDatos)
      .catch((e) => setError(e.message))
  }, [modo])

  const generarLocal = useCallback((tipo, pedido) => {
    if (pedido) setTranscripcion(pedido)
    setGenerando(true)
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => {
      setTipoReporte(tipo)
      setGenerando(false)
    }, 500)
  }, [])

  const generarConIa = useCallback(async (texto) => {
    const id = ++ultimoPedido.current
    setTranscripcion(texto)
    setGenerando(true)
    try {
      const r = await reportesIaService.generar(texto)
      if (id === ultimoPedido.current) setReporteIa(reporteDesdeIa(r))
    } catch (e) {
      if (id !== ultimoPedido.current) return
      if (e.status === 503) {
        toast.info(
          esAdmin
            ? 'La IA no está disponible en el servidor. Pasamos a los reportes básicos.'
            : 'La IA no está disponible en el servidor.',
        )
        setModo(modoSinIa)
      } else if (e.status === 422 || e.status === 429) {
        toast.advertencia(e.message)
      } else {
        toast.error(e.message)
      }
    } finally {
      if (id === ultimoPedido.current) setGenerando(false)
    }
  }, [esAdmin, modoSinIa])

  const pedir = useCallback(
    (texto) => {
      const limpio = texto.trim()
      if (!limpio) return
      if (modo === 'ia') {
        generarConIa(limpio)
        return
      }
      if (modo !== 'local') return
      const encontrado = EJEMPLOS.find((e) => e.patron.test(limpio))
      if (!encontrado) {
        toast.advertencia(`No reconocí un reporte en "${limpio}". Prueba con uno de los ejemplos.`)
        return
      }
      generarLocal(encontrado.tipo, limpio)
    },
    [modo, generarConIa, generarLocal],
  )

  const pedirActual = useRef(pedir)
  useEffect(() => {
    pedirActual.current = pedir
  }, [pedir])

  useEffect(() => {
    const r = crearReconocimiento()
    if (!r) return
    r.onresult = (e) => {
      const texto = e.results[0]?.[0]?.transcript ?? ''
      setTranscripcion(texto)
      pedirActual.current(texto)
    }
    r.onend = () => setEscuchando(false)
    r.onerror = (e) => {
      setEscuchando(false)
      toast.error(
        e.error === 'not-allowed'
          ? 'Permite el micrófono para dictar el reporte.'
          : 'No pudimos escucharte. Prueba de nuevo o usa los ejemplos.',
      )
    }
    reconocimiento.current = r
    return () => {
      r.onresult = null
      r.onend = null
      r.onerror = null
      reconocimiento.current = null
    }
  }, [])

  const alternarEscucha = () => {
    const r = reconocimiento.current
    if (!r) {
      toast.info('Tu navegador no tiene reconocimiento de voz. Escribe la pregunta o usa los ejemplos.')
      return
    }
    if (escuchando) {
      r.stop()
      return
    }
    setTranscripcion('')
    setEscuchando(true)
    r.start()
  }

  const enviarPregunta = (e) => {
    e.preventDefault()
    pedir(pregunta)
    setPregunta('')
  }

  const exportarPdf = () => {
    if (typeof window !== 'undefined') window.print()
  }

  const exportarExcel = () => {
    if (!reporte) return
    descargarCsv(`${reporte.tipo}-${hoyISO()}.csv`, reporte.encabezados, reporte.filas)
  }

  const bloqueado =
    modo === 'verificando' || modo === 'sin-ia' || generando || (modo === 'local' && (cargando || !!error))
  const conIa = modo === 'ia'
  const ejemplosIa = deSucursal ? EJEMPLOS_IA_SUCURSAL : EJEMPLOS_IA
  const ejemplos = conIa
    ? ejemplosIa.map((texto) => ({ clave: texto, texto }))
    : EJEMPLOS.map((e) => ({ clave: e.tipo, texto: e.texto }))

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="no-imprimir flex flex-col items-center py-8 text-center">
        <div className="relative flex h-40 w-40 items-center justify-center">
          {escuchando && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" aria-hidden="true"></span>
              <span
                className="absolute inset-4 animate-ping rounded-full bg-primary/30 [animation-delay:150ms]"
                aria-hidden="true"
              ></span>
              <span
                className="absolute inset-8 animate-ping rounded-full bg-primary/40 [animation-delay:300ms]"
                aria-hidden="true"
              ></span>
            </>
          )}
          <button
            type="button"
            className={cx(
              'relative flex h-24 w-24 items-center justify-center rounded-full bg-primary text-on-primary shadow-xl transition-transform hover:scale-105 disabled:opacity-50',
              escuchando && 'ring-8 ring-primary/20',
            )}
            disabled={bloqueado}
            onClick={alternarEscucha}
            aria-pressed={escuchando}
            aria-label="Micrófono"
          >
            <span className="material-symbols-outlined text-[44px]">{escuchando ? 'graphic_eq' : 'mic'}</span>
          </button>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-on-surface">
          {escuchando ? 'Te escucho...' : 'Pide tu reporte hablando'}
        </h1>
        {transcripcion && (
          <p className="mt-3 rounded-full bg-surface-container px-4 py-1.5 text-sm italic text-primary">"{transcripcion}"</p>
        )}

        {conIa && (
          <form className="mt-5 flex w-full max-w-xl gap-2" onSubmit={enviarPregunta}>
            <input
              type="text"
              className="campo flex-1 py-2"
              placeholder={deSucursal ? 'Ej.: ventas de marzo' : 'Ej.: ventas de marzo en la sucursal centro'}
              maxLength={500}
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              disabled={bloqueado}
              aria-label="Pregunta para el reporte"
            />
            <button type="submit" className="btn-primario px-4" disabled={bloqueado || !pregunta.trim()}>
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span> Generar
            </button>
          </form>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {ejemplos.map((e) => (
            <button
              key={e.clave}
              type="button"
              className="rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              disabled={bloqueado}
              onClick={() => pedir(e.texto)}
            >
              {e.texto}
            </button>
          ))}
        </div>

        {modo === 'local' &&
          (error ? (
            <p className="mt-4 text-sm text-error">No pudimos cargar los datos: {error}</p>
          ) : (
            cargando && <p className="mt-4 text-xs text-on-surface-variant">Preparando los datos del tablero...</p>
          ))}
      </div>

      {generando ? (
        <div className="tarjeta flex animate-pulse items-center gap-3 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          {conIa ? 'Analizando tu pregunta y generando el reporte...' : 'Generando el reporte...'}
        </div>
      ) : (
        reporte && (
          <article className="tarjeta">
            <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {conIa ? 'Reporte generado con IA' : 'Reporte generado'}
                </p>
                <h2 className="text-xl font-semibold text-on-surface">{reporte.titulo}</h2>
                <p className="text-sm text-on-surface-variant">{reporte.subtitulo}</p>
              </div>
              <div className="no-imprimir flex gap-2">
                <button type="button" className="btn-secundario" onClick={exportarPdf}>
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> PDF
                </button>
                <button type="button" className="btn-secundario" onClick={exportarExcel}>
                  <span className="material-symbols-outlined text-[18px]">table_view</span> Excel
                </button>
              </div>
            </header>

            {reporte.resumen && (
              <section className="mb-6 space-y-4">
                <p className="text-sm leading-relaxed text-on-surface">{reporte.resumen}</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ListaAnalisis icono="insights" titulo="Hallazgos" items={reporte.hallazgos} />
                  <ListaAnalisis icono="lightbulb" titulo="Recomendaciones" items={reporte.recomendaciones} />
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className={reporte.grafico === 'lineas' ? 'lg:col-span-12' : 'lg:col-span-5'}>
                {reporte.grafico === 'lineas' ? (
                  <GraficoLineas datos={reporte.serie} formato={reporte.formato} />
                ) : (
                  <GraficoBarras datos={reporte.serie} formato={reporte.formato} />
                )}
              </div>
              <div
                className={cx(
                  'tabla overflow-hidden rounded-xl border border-outline-variant',
                  reporte.grafico === 'lineas' ? 'lg:col-span-12' : 'lg:col-span-7',
                )}
              >
                <table>
                  <thead>
                    <tr>
                      {reporte.encabezados.map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.filas.length === 0 ? (
                      <tr>
                        <td colSpan={reporte.encabezados.length} className="py-8 text-center text-sm text-on-surface-variant">
                          Sin datos para este reporte.
                        </td>
                      </tr>
                    ) : (
                      reporte.filas.map((f, i) => (
                        <tr key={i}>
                          {f.map((c, j) => (
                            <td key={j} className="tabular-nums">
                              {c}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        )
      )}
    </div>
  )
}

function ListaAnalisis({ icono, titulo, items }) {
  if (!items?.length) return null
  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-on-surface">
        <span className="material-symbols-outlined text-[18px] text-primary">{icono}</span> {titulo}
      </h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-on-surface-variant">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
