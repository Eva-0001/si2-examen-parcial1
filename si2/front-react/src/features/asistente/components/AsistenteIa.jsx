import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { catalogoActual, catalogoService } from '@/features/catalogo/services/catalogo.service'
import { listaReferencia, nombreReferencia } from '@/core/stores/referencias.store'
import { authActual } from '@/core/stores/auth.store'
import { toast } from '@/core/stores/toast.store'
import { monedaBs } from '@/shared/utils/moneda-bs'
import { crearReconocimiento } from '@/shared/utils/voz'
import { cx } from '@/shared/utils/clases'
import { useSucursalActivaStore } from '@/core/stores/sucursal-activa.store'
import { buscarPrendas, tarjetaDeProducto } from '../asistente.utils'
import { asistenteService } from '../services/asistente.service'

const MENSAJE_INICIAL = {
  de: 'bot',
  texto:
    '¡Hola! Soy el asistente de FashionStore. Cuéntame qué buscas: prenda, color, talla, categoría, temporada o tu presupuesto (por ejemplo "chaqueta negra hasta 200 Bs").',
}

let iaHabilitada = null
const iaDisponible = () => {
  iaHabilitada ??= asistenteService
    .estado()
    .then((e) => !!e.habilitado)
    .catch(() => false)
  return iaHabilitada
}

function mensajeLocal(resultado) {
  if (resultado === null) {
    return 'Cuéntame qué prenda buscas: tipo de prenda, color, talla, categoría, colección, temporada o presupuesto (como "polera negra en talla M hasta 150 Bs").'
  }
  if (resultado.buscado) {
    return `No encontré "${resultado.buscado}" en el catálogo. Prueba con otro tipo de prenda, color, talla o categoría.`
  }
  const detalle = resultado.filtros.length ? ` ${resultado.filtros.join(', ')}` : ''
  return `No encontré prendas con stock${detalle}. Prueba con otro color, talla, categoría o presupuesto.`
}

function respuestaLocal(texto, catalogo, sucursalId, aviso = '') {
  const resultado = buscarPrendas(texto, { catalogo, listaReferencia, nombreReferencia, sucursalId })
  if (!(resultado?.total > 0)) return { de: 'bot', texto: `${mensajeLocal(resultado)}${aviso}` }

  const detalle = resultado.filtros.length ? ` ${resultado.filtros.join(', ')}` : ''
  const cuantas = resultado.total === 1 ? '1 prenda' : `${resultado.total} prendas`
  const muestra = resultado.total > resultado.productos.length ? `; te muestro ${resultado.productos.length}` : ''
  return {
    de: 'bot',
    texto: `Encontré ${cuantas}${detalle}${muestra}. Toca una para ver tallas, colores y disponibilidad:${aviso}`,
    productos: resultado.productos,
  }
}

/**
 * Las recomendaciones las decide Gemini. La búsqueda en el catálogo solo se usa si no hay
 * sesión, si la IA no está configurada o si Gemini falla.
 */
async function responder(texto) {
  const catalogo = catalogoActual()
  const sucursalId = useSucursalActivaStore.getState().sucursal?.id ?? null

  if (!authActual().estaLogueado) {
    return respuestaLocal(texto, catalogo, sucursalId, ' Inicia sesión para recibir recomendaciones con IA.')
  }
  if (!(await iaDisponible())) return respuestaLocal(texto, catalogo, sucursalId)

  try {
    const r = await asistenteService.consultar(texto, sucursalId)
    const productos = r.productos
      .map((p) => {
        const tarjeta = tarjetaDeProducto(catalogo, p.producto_id, sucursalId)
        return tarjeta && { ...tarjeta, motivo: p.motivo }
      })
      .filter(Boolean)
    return {
      de: 'bot',
      ia: true,
      texto: r.respuesta || (productos.length ? 'Te sugiero estas prendas:' : 'No encontré prendas para eso.'),
      productos,
    }
  } catch (e) {
    if (e.status === 429) return { de: 'bot', texto: e.message }
    return respuestaLocal(texto, catalogo, sucursalId)
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
      .then(() => responder(limpio))
      .catch(() => ({ de: 'bot', texto: 'No pude cargar el catálogo. Revisa tu conexión e intenta de nuevo.' }))
      .then((respuesta) => {
        setMensajes((m) => [...m, respuesta])
        setEscribiendo(false)
      })
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
              <p className="text-[11px] text-on-surface-variant">Busca por prenda, color, talla, categoría, colección o temporada</p>
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
                  {m.ia && (
                    <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span> Sugerencia con IA
                    </p>
                  )}
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
                            {p.motivo && <p className="text-[11px] text-on-surface-variant">{p.motivo}</p>}
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
