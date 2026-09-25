import { useCallback, useEffect, useState } from 'react'
import { reservasService } from '../services/reservas.service'
import ModalReprogramar from '../components/ModalReprogramar'
import { estadoReserva, horaCorta, numeroReserva, sucursalDeReserva, unidadesDeReserva } from '../reservas.utils'
import { sucursalesService } from '@/features/sucursales/services/sucursales.service'
import { productosService } from '@/features/productos/services/productos.service'
import { useSucursalActivaStore } from '@/core/stores/sucursal-activa.store'
import { cargarReferencias } from '@/core/stores/referencias.store'
import { toast } from '@/core/stores/toast.store'
import Skeleton from '@/shared/components/Skeleton'
import EstadoVacio from '@/shared/components/EstadoVacio'
import ChipsProducto from '@/shared/components/ChipsProducto'
import { desdeISO, hoyISO } from '@/shared/utils/fechas'
import { formatoFecha } from '@/shared/utils/formato'
import { cx } from '@/shared/utils/clases'

const CHECKLIST_KEY = 'checklist_reservas'
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const CLASE_HORA = { asistio: 'bg-success', vencida: 'bg-outline', pendiente: 'bg-primary' }
const CLASE_CHIP = {
  asistio: 'bg-success/10 text-success',
  vencida: 'bg-surface-container-low text-on-surface-variant',
  pendiente: 'bg-warning/10 text-warning',
}
const ETIQUETA = { asistio: 'Asistió', vencida: 'No asistió', pendiente: 'Pendiente' }

function leerChecklist() {
  try {
    return JSON.parse(localStorage.getItem(CHECKLIST_KEY) ?? '{}')
  } catch {
    return {}
  }
}

const aISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const iniciales = (r) => {
  const u = r.usuario
  return u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}`.toUpperCase() : '?'
}

const foto = (d) => {
  const p = d.producto_sucursal?.producto
  return p ? productosService.urlFoto(p) : null
}

export default function ReservasSucursal() {
  const sucursal = useSucursalActivaStore((s) => s.sucursal)
  const [hoy] = useState(() => hoyISO())

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [sucursales, setSucursales] = useState([])
  const [reservas, setReservas] = useState([])

  const [dia, setDia] = useState(hoy)
  const [confirmando, setConfirmando] = useState(null)
  const [aReprogramar, setAReprogramar] = useState(null)
  const [checklist, setChecklist] = useState(leerChecklist)

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checklist))
    } catch {
      return
    }
  }, [checklist])

  const deLaSucursal = reservas.filter((r) => sucursalDeReserva(r)?.id === sucursal?.id)
  const delDia = deLaSucursal.filter((r) => r.fecha === dia).sort((a, b) => a.hora.localeCompare(b.hora))

  const pendientes = deLaSucursal.filter((r) => estadoReserva(r) === 'pendiente')
  const resumen = {
    hoy: deLaSucursal.filter((r) => r.fecha === hoy).length,
    pendientes: pendientes.length,
    prendas: pendientes.filter((r) => r.fecha === hoy).reduce((acc, r) => acc + unidadesDeReserva(r), 0),
  }

  const fechaDia = desdeISO(dia)
  const tituloDia = `${dia === hoy ? 'Hoy' : DIAS[fechaDia.getDay()]}, ${fechaDia.getDate()}/${String(fechaDia.getMonth() + 1).padStart(2, '0')}`

  const pedir = useCallback(() => {
    Promise.all([
      sucursalesService.listar(),
      reservasService.listar().then((lista) => reservasService.obtenerVarias(lista.map((r) => r.id))),
      cargarReferencias(),
    ])
      .then(([listaSucursales, listaReservas]) => {
        setSucursales(listaSucursales)
        const activa = useSucursalActivaStore.getState()
        if (!activa.sucursal && listaSucursales.length > 0) activa.seleccionar(listaSucursales[0])
        setReservas(listaReservas)
        setCargando(false)
      })
      .catch((e) => {
        setError(e.message)
        setCargando(false)
      })
  }, [])

  useEffect(() => {
    pedir()
  }, [pedir])

  const cargar = () => {
    setCargando(true)
    setError(null)
    pedir()
  }

  const cambiarSucursal = (valor) => {
    const s = sucursales.find((x) => x.id === Number(valor))
    if (s) useSucursalActivaStore.getState().seleccionar(s)
  }

  const moverDia = (delta) => {
    const d = desdeISO(dia)
    d.setDate(d.getDate() + delta)
    setDia(aISO(d))
  }

  const preparado = (r, d) => (checklist[r.id] ?? []).includes(d.id)
  const preparados = (r) => (checklist[r.id] ?? []).length

  const alternarPreparado = (r, d) => {
    setChecklist((c) => {
      const actual = c[r.id] ?? []
      const nuevo = actual.includes(d.id) ? actual.filter((x) => x !== d.id) : [...actual, d.id]
      return { ...c, [r.id]: nuevo }
    })
  }

  const confirmarAsistencia = (r) => {
    setConfirmando(r.id)
    reservasService
      .actualizar(r.id, { asistencia: true })
      .then(() => {
        setReservas((lista) => lista.map((x) => (x.id === r.id ? { ...x, asistencia: true } : x)))
        setConfirmando(null)
        toast.exito(`Asistencia confirmada para ${r.usuario?.nombre ?? 'el cliente'}`)
      })
      .catch((e) => {
        setConfirmando(null)
        toast.error(e.message)
      })
  }

  const alReprogramar = (actualizada) => {
    setReservas((lista) =>
      lista.map((x) => (x.id === actualizada.id ? { ...x, fecha: actualizada.fecha, hora: actualizada.hora } : x)),
    )
    setAReprogramar(null)
    setDia(actualizada.fecha)
  }

  let contenido
  if (cargando) {
    contenido = <Skeleton tipo="tabla" cantidad={3} />
  } else if (error) {
    contenido = (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <span className="material-symbols-outlined text-[40px] text-error">cloud_off</span>
        <h3 className="mt-2 text-lg font-semibold text-on-surface">No pudimos cargar las reservas</h3>
        <p className="text-sm text-on-surface-variant">{error}</p>
        <button type="button" className="btn-secundario mt-6" onClick={cargar}>
          Reintentar
        </button>
      </div>
    )
  } else {
    contenido = (
      <>
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="tarjeta py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Reservas de hoy</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-on-surface">{resumen.hoy}</p>
          </div>
          <div className="tarjeta py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-warning">Pendientes de asistencia</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-warning">{resumen.pendientes}</p>
          </div>
          <div className="tarjeta py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Prendas por preparar hoy</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">{resumen.prendas}</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 shadow-card">
          <button type="button" className="btn-icono" onClick={() => moverDia(-1)} aria-label="Día anterior">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-on-surface">{tituloDia}</p>
            <input type="date" className="campo w-40 py-1.5 text-xs" value={dia} onChange={(e) => setDia(e.target.value)} />
            {dia !== hoy && (
              <button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={() => setDia(hoy)}>
                Hoy
              </button>
            )}
          </div>
          <button type="button" className="btn-icono" onClick={() => moverDia(1)} aria-label="Día siguiente">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {delDia.length === 0 ? (
          <div className="tarjeta p-0">
            <EstadoVacio
              icono="event_available"
              titulo={'Sin reservas para ' + tituloDia.toLowerCase()}
              descripcion="Cuando un cliente reserve prendas para este día en tu sucursal, van a aparecer aquí."
            />
          </div>
        ) : (
          <ul className="space-y-4">
            {delDia.map((r) => {
              const estado = estadoReserva(r)
              return (
                <li
                  key={r.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card md:flex-row"
                >
                  <div
                    className={cx(
                      'flex shrink-0 flex-row items-center justify-center gap-3 px-6 py-4 text-white md:w-32 md:flex-col md:gap-0',
                      CLASE_HORA[estado],
                    )}
                  >
                    <span className="text-3xl font-bold tabular-nums leading-none">{horaCorta(r.hora)}</span>
                    <span className="text-xs font-medium opacity-90">{formatoFecha(r.fecha, 'dd/MM')}</span>
                  </div>

                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-xs font-bold text-primary">
                        {iniciales(r)}
                      </span>
                      <div>
                        <p className="font-semibold text-on-surface">
                          {r.usuario?.nombre} {r.usuario?.apellido}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {numeroReserva(r.id)} · {r.usuario?.correo}
                        </p>
                      </div>
                      <span className={cx('ml-auto inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', CLASE_CHIP[estado])}>
                        {ETIQUETA[estado]}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Prendas a preparar</p>
                      <span className="text-xs text-on-surface-variant">
                        {preparados(r)} de {r.detalles.length} listas
                      </span>
                    </div>
                    <ul className="mt-1.5 space-y-1.5">
                      {r.detalles.map((d) => {
                        const listo = preparado(r, d)
                        const f = foto(d)
                        const p = d.producto_sucursal?.producto
                        return (
                          <li key={d.id}>
                            <label
                              className={cx(
                                'flex cursor-pointer items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-surface-container-low',
                                listo && 'opacity-60',
                              )}
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-outline accent-primary"
                                checked={listo}
                                onChange={() => alternarPreparado(r, d)}
                              />
                              <div className="h-11 w-9 shrink-0 overflow-hidden rounded-md bg-surface-container">
                                {f && <img src={f} alt="" className="h-full w-full object-cover" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={cx('truncate text-sm font-semibold text-on-surface', listo && 'line-through')}>
                                  {p?.nombre}
                                </p>
                                {p && <ChipsProducto producto={p} mostrar={['talla', 'color']} />}
                              </div>
                              <span className="text-sm font-bold tabular-nums">x{d.cantidad}</span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <div className="flex shrink-0 flex-row gap-2 border-t border-outline-variant p-4 md:w-48 md:flex-col md:border-l md:border-t-0">
                    {!r.asistencia ? (
                      <>
                        <button
                          type="button"
                          className="btn-primario flex-1 bg-success hover:bg-emerald-700"
                          disabled={confirmando === r.id}
                          onClick={() => confirmarAsistencia(r)}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {confirmando === r.id ? 'progress_activity' : 'how_to_reg'}
                          </span>
                          Confirmar asistencia
                        </button>
                        <button type="button" className="btn-secundario flex-1" onClick={() => setAReprogramar(r)}>
                          <span className="material-symbols-outlined text-[18px]">edit_calendar</span> Reprogramar
                        </button>
                      </>
                    ) : (
                      <p className="flex items-center gap-1 text-sm font-semibold text-success">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span> Cliente atendido
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Reservas de mi sucursal</h1>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
              store
            </span>
            <select
              className="campo w-60 appearance-none pl-9 pr-9 font-semibold"
              value={sucursal?.id ?? ''}
              onChange={(e) => cambiarSucursal(e.target.value)}
              disabled={cargando}
              aria-label="Sucursal"
            >
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
              expand_more
            </span>
          </div>
        </div>

        {contenido}
      </div>

      {aReprogramar && (
        <ModalReprogramar reserva={aReprogramar} onCerrar={() => setAReprogramar(null)} onGuardado={alReprogramar} />
      )}
    </>
  )
}
