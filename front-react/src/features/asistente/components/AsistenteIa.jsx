import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { catalogoActual, catalogoService } from '@/features/catalogo/services/catalogo.service'
import { listaReferencia, nombreReferencia } from '@/core/stores/referencias.store'
import { toast } from '@/core/stores/toast.store'
import { monedaBs } from '@/shared/utils/moneda-bs'
import { crearReconocimiento } from '@/shared/utils/voz'
import { cx } from '@/shared/utils/clases'

const SUGERENCIAS = ['Qué me pongo para una entrevista', 'Muéstrame ropa de verano', 'Algo en talla M']

const MENSAJE_INICIAL = {
  de: 'bot',
  texto: '¡Hola! Soy el asistente de FashionStore. Cuéntame qué buscas y te recomiendo prendas con stock en tu sucursal.',
}

function responder(texto) {
  const t = texto.toLowerCase()
  const grupos = catalogoActual().grupos
  const disponibles = grupos.filter((g) => g.disponibilidad !== 'agotado')
  const base = disponibles.length ? disponibles : grupos

  const categoria = listaReferencia('categorias').find((c) => t.includes(c.nombre.toLowerCase().replace(/s$/, '')))
  const temporada = listaReferencia('temporadas').find((tp) =>
    tp.nombre
      .toLowerCase()
      .split(/[\s-]+/)
      .some((p) => p.length > 3 && t.includes(p)),
  )
  const talla = listaReferencia('tallas').find((ta) => new RegExp(`talla\\s+${ta.nombre.toLowerCase()}\\b`).test(t))

  let candidatos = base
  let intro = ''
  if (categoria) {
    candidatos = candidatos.filter((g) => g.categoria_id === categoria.id)
    intro = `Esto tengo en ${categoria.nombre.toLowerCase()}`
  }
  if (temporada) {
    const filtrados = candidatos.filter((g) => g.temporada_id === temporada.id)
    if (filtrados.length) {
      candidatos = filtrados
      intro = `Para ${temporada.nombre} te sugiero`
    }
  }
  if (talla) {
    const filtrados = candidatos.filter((g) => g.tallas.includes(talla.id))
    candidatos = filtrados
    intro = intro ? `${intro}, en talla ${talla.nombre}` : `En talla ${talla.nombre} tienes`
  }
  if (/entrevista|formal|oficina|trabajo/.test(t)) {
    const formales = base.filter(
      (g) =>
        /camisa|pantal|blazer|saco|vestido/i.test(g.nombre) ||
        /formal/i.test(nombreReferencia('colecciones', g.coleccion_id) ?? ''),
    )
    if (formales.length) {
      candidatos = formales
      intro = 'Para una entrevista, algo sobrio y prolijo'
    }
  }

  const productos = candidatos.slice(0, 3)
  if (productos.length === 0) {
    return {
      de: 'bot',
      texto:
        'No encontré prendas con eso en tu sucursal. Prueba con otra categoría o talla, o cambia de sucursal desde el selector de arriba.',
    }
  }
  return {
    de: 'bot',
    texto: `${intro || 'Mira estas novedades'}. Toca una para ver tallas, colores y disponibilidad:`,
    productos,
  }
}

export default function AsistenteIa() {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [escuchando, setEscuchando] = useState(false)
  const [mensajes, setMensajes] = useState([MENSAJE_INICIAL])

  const listaRef = useRef(null)
  const reconocimientoRef = useRef(null)

  const alternar = () => {
    setAbierto((v) => !v)
    if (!abierto) catalogoService.cargar().catch(() => {})
  }

  const enviar = (entrada = texto) => {
    const limpio = entrada.trim()
    if (!limpio || escribiendo) return
    setTexto('')
    setMensajes((m) => [...m, { de: 'usuario', texto: limpio }])
    setEscribiendo(true)

    catalogoService
      .cargar()
      .then(() => {
        setTimeout(() => {
          setMensajes((m) => [...m, responder(limpio)])
          setEscribiendo(false)
        }, 600)
      })
      .catch(() => {})
  }

  const enviarRef = useRef(enviar)
  useEffect(() => {
    enviarRef.current = enviar
  })

  useEffect(() => {
    const r = crearReconocimiento()
    if (r) {
      r.onresult = (e) => enviarRef.current(e.results[0]?.[0]?.transcript ?? '')
      r.onend = () => setEscuchando(false)
      r.onerror = () => setEscuchando(false)
    }
    reconocimientoRef.current = r
    return () => r?.abort?.()
  }, [])

  useEffect(() => {
    const el = listaRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [mensajes, escribiendo, abierto])

  const dictar = () => {
    const reconocimiento = reconocimientoRef.current
    if (!reconocimiento) {
      toast.info('Tu navegador no tiene reconocimiento de voz.')
      return
    }
    if (escuchando) {
      reconocimiento.stop()
      return
    }
    setEscuchando(true)
    reconocimiento.start()
  }

  return (
    <>
      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-xl transition-transform hover:scale-105"
        onClick={alternar}
        aria-expanded={abierto}
        aria-label="Asistente FashionStore"
      >
        <span className="material-symbols-outlined text-[28px]">{abierto ? 'close' : 'auto_awesome'}</span>
      </button>

      {abierto && (
        <section
          className="fixed bottom-24 right-6 z-40 flex h-[600px] max-h-[calc(100vh-7rem)] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl"
          role="dialog"
          aria-label="Asistente FashionStore"
        >
          <header className="flex items-center gap-3 border-b border-outline-variant bg-surface-container px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary">
              <span className="material-symbols-outlined">auto_awesome</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-on-surface">Asistente FashionStore</p>
              <p className="text-[11px] text-on-surface-variant">Demo con el catálogo real · IA generativa no conectada</p>
            </div>
            <button type="button" className="btn-icono" onClick={alternar} aria-label="Cerrar">
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          <div ref={listaRef} className="flex-1 space-y-3 overflow-y-auto bg-surface p-4">
            {mensajes.map((m, i) => (
              <div key={i} className={cx('flex', m.de === 'usuario' && 'justify-end')}>
                <div
                  className={cx(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
                    m.de === 'usuario'
                      ? 'rounded-br-md bg-primary text-on-primary'
                      : 'rounded-bl-md bg-surface-container-low text-on-surface',
                  )}
                >
                  <p>{m.texto}</p>
                  {m.productos?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.productos.map((p) => (
                        <Link
                          key={p.clave}
                          to={`/producto/${p.id}`}
                          className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-2 transition-colors hover:border-primary"
                          onClick={alternar}
                        >
                          <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                            {p.foto ? (
                              <img src={p.foto} alt={p.nombre} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-primary/40">
                                <span className="material-symbols-outlined text-[20px]">checkroom</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-on-surface">{p.nombre}</p>
                            <p className="text-xs font-bold text-on-surface">
                              {p.precioDesde !== null ? monedaBs(p.precioDesde) : 'Consultar'}
                            </p>
                            <p
                              className={cx(
                                'text-[11px]',
                                p.disponibilidad === 'disponible' ? 'text-success' : 'text-on-surface-variant',
                              )}
                            >
                              {p.disponibilidad === 'disponible' ? 'Disponible en tu sucursal' : 'En otras sucursales'}
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {escribiendo && (
              <div className="flex">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-surface-container-low px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant [animation-delay:120ms]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant [animation-delay:240ms]"></span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-outline-variant bg-surface-container-lowest p-3">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="shrink-0 rounded-full border border-outline-variant px-3 py-1 text-[11px] font-semibold text-on-surface-variant hover:border-primary hover:text-primary"
                  onClick={() => enviar(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                enviar()
              }}
            >
              <input
                type="text"
                className="campo flex-1 py-2"
                placeholder="Escribe tu consulta..."
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
              <button
                type="button"
                className={cx('btn-icono', escuchando && 'text-error')}
                onClick={dictar}
                aria-pressed={escuchando}
                aria-label="Dictar"
              >
                <span className="material-symbols-outlined">{escuchando ? 'graphic_eq' : 'mic'}</span>
              </button>
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50"
                disabled={!texto.trim() || escribiendo}
                aria-label="Enviar"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  )
}
