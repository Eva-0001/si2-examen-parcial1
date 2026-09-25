import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { reservasService } from '../services/reservas.service'
import { HORARIOS, ahoraHHmm } from '../reservas.utils'
import { useReservaBorrador, useReservaBorradorStore } from '@/core/stores/reserva-borrador.store'
import { useSucursalActivaStore } from '@/core/stores/sucursal-activa.store'
import { resumenItems } from '@/core/stores/lista-items'
import { useAuthStore } from '@/core/stores/auth.store'
import { toast } from '@/core/stores/toast.store'
import { desdeISO, hoyISO } from '@/shared/utils/fechas'
import { cx } from '@/shared/utils/clases'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function fechaLarga(iso) {
  const d = desdeISO(iso)
  return `${DIAS_LARGOS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

export default function NuevaReserva() {
  const navigate = useNavigate()
  const borrador = useReservaBorrador()
  const sucursales = useSucursalActivaStore((s) => s.sucursales)
  const ciudadesLista = useSucursalActivaStore((s) => s.ciudades)

  const [hoy] = useState(() => hoyISO())
  const [sucursalId, setSucursalId] = useState(
    () =>
      resumenItems(useReservaBorradorStore.getState().items).sucursal?.id ??
      useSucursalActivaStore.getState().sucursal?.id ??
      null,
  )
  const [fecha, setFecha] = useState(null)
  const [hora, setHora] = useState(null)
  const [mesVisible, setMesVisible] = useState(() => hoyISO().slice(0, 7))
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)

  useEffect(() => {
    const estado = useSucursalActivaStore.getState()
    if (estado.sucursales.length === 0) estado.cargar()
  }, [])

  const sucursalElegida = sucursales.find((s) => s.id === sucursalId) ?? null
  const ciudades = new Map(ciudadesLista.map((c) => [c.id, c.nombre]))
  const ciudadDe = (s) => ciudades.get(s.ciudad_id) ?? ''

  const itemsOtraSucursal = borrador.items.filter((i) => sucursalId !== null && i.sucursal_id !== sucursalId)

  const [anio, mes] = mesVisible.split('-').map(Number)
  const tituloMes = `${MESES[mes - 1]} ${anio}`

  const primero = new Date(anio, mes - 1, 1)
  const desplazamiento = (primero.getDay() + 6) % 7
  const inicio = new Date(anio, mes - 1, 1 - desplazamiento)
  const calendario = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { iso, dia: d.getDate(), delMes: d.getMonth() === mes - 1, pasado: iso < hoy }
  })

  const puedeRetroceder = mesVisible > hoy.slice(0, 7)

  const listo =
    sucursalId !== null && fecha !== null && hora !== null && borrador.items.length > 0 && itemsOtraSucursal.length === 0

  const cambiarMes = (delta) => {
    const d = new Date(anio, mes - 1 + delta, 1)
    setMesVisible(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const horaDeshabilitada = (h, dia = fecha) => dia === hoy && h <= ahoraHHmm()

  const elegirFecha = (d) => {
    if (d.pasado) return
    setFecha(d.iso)
    if (hora && horaDeshabilitada(hora, d.iso)) setHora(null)
  }

  const cambiar = (item, delta) => borrador.cambiarCantidad(item.producto_sucursal_id, item.cantidad + delta)

  const confirmar = () => {
    const usuario = useAuthStore.getState().usuario
    if (!usuario || !listo) return

    setGuardando(true)
    setErrorGeneral(null)

    reservasService
      .crear({
        fecha,
        hora: `${hora}:00`,
        usuario_id: usuario.id,
        detalles: borrador.items.map((i) => ({ producto_sucursal_id: i.producto_sucursal_id, cantidad: i.cantidad })),
      })
      .then(() => {
        borrador.vaciar()
        toast.exito('Reserva confirmada. Te esperamos en la sucursal.')
        navigate('/reservas')
      })
      .catch((e) => {
        setGuardando(false)
        setErrorGeneral(e.status === 409 ? `${e.message}. Ajusta las cantidades.` : e.message)
      })
  }

  return (
    <>
      <div className="mb-6">
        <Link
          to="/reservas"
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span> Mis reservas
        </Link>
        <h1 className="text-3xl font-semibold text-on-surface">Nueva reserva</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Elige dónde y cuándo quieres probarte las prendas.</p>
      </div>

      <div className="mb-6 flex items-start gap-2 rounded-lg border-l-4 border-sky-500 bg-sky-50 p-3 text-sm text-on-surface">
        <span className="material-symbols-outlined text-[20px] text-sky-600">info</span>
        <span>
          <strong>Reservar no descuenta stock.</strong> Las prendas te esperan en la sucursal el día elegido; decides qué
          comprar después de probártelas.
        </span>
      </div>

      {errorGeneral && (
        <div className="mb-6 rounded-lg border-l-4 border-error bg-error/5 p-3 text-sm text-on-surface" role="alert">
          <span className="font-semibold text-error">No pudimos crear la reserva.</span> {errorGeneral}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <section className="tarjeta">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                1
              </span>{' '}
              Sucursal
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sucursales.length > 0 ? (
                sucursales.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={cx(
                      'flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors',
                      sucursalId === s.id ? 'border-primary bg-surface-container' : 'border-outline-variant hover:border-primary',
                    )}
                    onClick={() => setSucursalId(s.id)}
                  >
                    <span className="material-symbols-outlined mt-0.5 text-primary">storefront</span>
                    <span>
                      <span className="block text-sm font-semibold text-on-surface">{s.nombre}</span>
                      <span className="block text-xs text-on-surface-variant">
                        {s.ubicacion}, {ciudadDe(s)}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-on-surface-variant">Cargando sucursales...</p>
              )}
            </div>
            {itemsOtraSucursal.length > 0 && (
              <div className="mt-4 rounded-lg border-l-4 border-warning bg-warning/10 p-3 text-xs text-on-surface">
                <p className="font-semibold">Elegiste una sucursal distinta a la de tus prendas.</p>
                <p className="mt-1 text-on-surface-variant">
                  El stock se verifica por sucursal. Vuelve a la sucursal de las prendas o quita las que no correspondan.
                </p>
                {borrador.sucursales.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="mt-2 mr-2 rounded-full border border-warning bg-surface-container-lowest px-3 py-1 text-xs font-semibold hover:bg-warning hover:text-white"
                    onClick={() => setSucursalId(s.id)}
                  >
                    Reservar en {s.nombre}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="tarjeta">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                2
              </span>{' '}
              Fecha
            </h2>
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                className="btn-icono"
                disabled={!puedeRetroceder}
                onClick={() => cambiarMes(-1)}
                aria-label="Mes anterior"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <p className="text-sm font-semibold capitalize text-on-surface">{tituloMes}</p>
              <button type="button" className="btn-icono" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {DIAS.map((d, i) => (
                <span key={i} className="py-1 text-[11px] font-semibold uppercase text-on-surface-variant">
                  {d}
                </span>
              ))}
              {calendario.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  className={cx(
                    'aspect-square rounded-lg text-sm transition-colors disabled:cursor-not-allowed',
                    fecha === d.iso
                      ? 'bg-primary font-bold text-on-primary'
                      : d.pasado || !d.delMes
                        ? 'text-outline'
                        : d.iso === hoy
                          ? 'bg-surface-container font-semibold text-primary hover:bg-primary hover:text-on-primary'
                          : 'text-on-surface hover:bg-surface-container',
                  )}
                  disabled={d.pasado}
                  onClick={() => elegirFecha(d)}
                >
                  {d.dia}
                </button>
              ))}
            </div>
          </section>

          <section className="tarjeta">
            <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-on-surface">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
                3
              </span>{' '}
              Hora
            </h2>
            <p className="mb-4 text-xs text-on-surface-variant">
              Atendemos de 10:00 a 20:00. {fecha ? '' : 'Elige primero una fecha.'}
            </p>
            <div className={cx('grid grid-cols-4 gap-2 sm:grid-cols-6', !fecha && 'opacity-50')}>
              {HORARIOS.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={cx(
                    'rounded-lg border py-2 text-sm font-semibold tabular-nums transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-40',
                    hora === h
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary',
                  )}
                  disabled={!fecha || horaDeshabilitada(h)}
                  onClick={() => setHora(h)}
                >
                  {h}
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div className="tarjeta lg:sticky lg:top-24">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-on-surface">Prendas para probar</h2>
              <span className="chip">
                {borrador.cantidadTotal} {borrador.cantidadTotal === 1 ? 'prenda' : 'prendas'}
              </span>
            </div>

            {borrador.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-outline-variant p-6 text-center">
                <span className="material-symbols-outlined text-[36px] text-primary/40">checkroom</span>
                <p className="mt-2 text-sm font-semibold text-on-surface">Todavía no elegiste prendas</p>
                <p className="text-xs text-on-surface-variant">Desde la ficha de un producto toca "Reservar para probar".</p>
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant">
                {borrador.items.map((item) => (
                  <li
                    key={item.producto_sucursal_id}
                    className={cx('flex gap-3 py-3', sucursalId !== null && item.sucursal_id !== sucursalId && 'opacity-60')}
                  >
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                      {item.foto && <img src={item.foto} alt={item.nombre} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-on-surface">{item.nombre}</p>
                      <p className="text-xs text-on-surface-variant">
                        Talla {item.talla} · {item.color}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">{item.sucursal}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-outline-variant">
                          <button
                            type="button"
                            className="px-2 py-0.5 text-on-surface-variant hover:text-primary"
                            onClick={() => cambiar(item, -1)}
                            aria-label="Menos"
                          >
                            <span className="material-symbols-outlined text-[16px]">remove</span>
                          </button>
                          <span className="min-w-6 text-center text-xs font-semibold tabular-nums">{item.cantidad}</span>
                          <button
                            type="button"
                            className="px-2 py-0.5 text-on-surface-variant hover:text-primary disabled:opacity-40"
                            disabled={item.cantidad >= item.maximo}
                            onClick={() => cambiar(item, 1)}
                            aria-label="Más"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          className="btn-icono-peligro p-1"
                          title="Quitar"
                          onClick={() => borrador.quitar(item.producto_sucursal_id)}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <Link to="/catalogo" className="btn-secundario mt-4 w-full">
              <span className="material-symbols-outlined text-[18px]">add</span> Agregar otra prenda
            </Link>

            <dl className="mt-5 space-y-1.5 border-t border-outline-variant pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Sucursal</dt>
                <dd className="font-semibold">{sucursalElegida?.nombre ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Fecha</dt>
                <dd className="font-semibold capitalize">{fecha ? fechaLarga(fecha) : '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-on-surface-variant">Hora</dt>
                <dd className="font-semibold tabular-nums">{hora ?? '—'}</dd>
              </div>
            </dl>

            <button type="button" className="btn-primario mt-5 w-full py-3" disabled={!listo || guardando} onClick={confirmar}>
              {guardando ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Confirmando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">event_available</span> Confirmar reserva
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}
