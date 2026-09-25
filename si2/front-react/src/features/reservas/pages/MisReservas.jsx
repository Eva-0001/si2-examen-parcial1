import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { reservasService } from '../services/reservas.service'
import {
  CHIP_ESTADO,
  ETIQUETA_ESTADO,
  esProxima,
  estadoReserva,
  horaCorta,
  numeroReserva,
  sucursalDeReserva,
  unidadesDeReserva,
} from '../reservas.utils'
import { cargarReferencias, useReferencias } from '@/core/stores/referencias.store'
import { productosService } from '@/features/productos/services/productos.service'
import { toast } from '@/core/stores/toast.store'
import Skeleton from '@/shared/components/Skeleton'
import EstadoVacio from '@/shared/components/EstadoVacio'
import ModalConfirmacion from '@/shared/components/ModalConfirmacion'
import { formatoFecha } from '@/shared/utils/formato'
import { cx } from '@/shared/utils/clases'

const foto = (d) => {
  const p = d.producto_sucursal?.producto
  return p ? productosService.urlFoto(p) : null
}

export default function MisReservas() {
  const referencias = useReferencias()

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [reservas, setReservas] = useState([])
  const [pestana, setPestana] = useState('proximas')
  const [expandida, setExpandida] = useState(null)

  const [aCancelar, setACancelar] = useState(null)
  const [cancelando, setCancelando] = useState(false)
  const [errorCancelar, setErrorCancelar] = useState(null)

  const pedir = useCallback(() => {
    reservasService
      .listar()
      .then((lista) => reservasService.obtenerVarias(lista.map((r) => r.id)))
      .then((detalles) => {
        setReservas(detalles)
        setCargando(false)
      })
      .catch((e) => {
        setError(e.message)
        setCargando(false)
      })
  }, [])

  useEffect(() => {
    cargarReferencias().catch(() => {})
    pedir()
  }, [pedir])

  const cargar = () => {
    setCargando(true)
    setError(null)
    pedir()
  }

  const proximas = reservas
    .filter((r) => esProxima(r))
    .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
  const historial = reservas
    .filter((r) => !esProxima(r))
    .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`))
  const visibles = pestana === 'proximas' ? proximas : historial

  const alternar = (r) => setExpandida((actual) => (actual === r.id ? null : r.id))

  const pedirCancelar = (r) => {
    setErrorCancelar(null)
    setACancelar(r)
  }

  const cancelar = () => {
    const r = aCancelar
    if (!r) return
    setCancelando(true)
    reservasService
      .cancelar(r.id)
      .then(() => {
        setReservas((lista) => lista.filter((x) => x.id !== r.id))
        setCancelando(false)
        setACancelar(null)
        toast.exito('Reserva cancelada')
      })
      .catch((e) => {
        setCancelando(false)
        setErrorCancelar(e.message)
      })
  }

  const clasePestana = (activa) =>
    cx(
      '-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors',
      activa ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface',
    )

  let contenido
  if (cargando) {
    contenido = <Skeleton tipo="tabla" cantidad={3} />
  } else if (error) {
    contenido = (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <span className="material-symbols-outlined text-[40px] text-error">cloud_off</span>
        <h3 className="mt-2 text-lg font-semibold text-on-surface">No pudimos cargar tus reservas</h3>
        <p className="text-sm text-on-surface-variant">{error}</p>
        <button type="button" className="btn-secundario mt-6" onClick={cargar}>
          Reintentar
        </button>
      </div>
    )
  } else if (visibles.length === 0) {
    contenido = (
      <div className="tarjeta p-0">
        {pestana === 'proximas' ? (
          <>
            <EstadoVacio
              icono="event"
              titulo="No tienes reservas próximas"
              descripcion="Elige prendas en el catálogo y resérvalas para probártelas sin compromiso."
            />
            <div className="pb-10 text-center">
              <Link to="/catalogo" className="btn-primario">
                Ver catálogo
              </Link>
            </div>
          </>
        ) : (
          <EstadoVacio
            icono="history"
            titulo="Todavía no hay historial"
            descripcion="Aquí van a quedar las reservas a las que asististe o que vencieron."
          />
        )}
      </div>
    )
  } else {
    contenido = (
      <ul className="space-y-4">
        {visibles.map((r) => {
          const estado = estadoReserva(r)
          const sucursal = sucursalDeReserva(r)
          const unidades = unidadesDeReserva(r)
          return (
            <li key={r.id} className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card">
              <div className="flex flex-col md:flex-row">
                <div
                  className={cx(
                    'flex shrink-0 flex-row items-center justify-center gap-3 px-6 py-4 text-white md:w-36 md:flex-col md:gap-0',
                    estado === 'pendiente' ? 'bg-primary' : estado === 'asistio' ? 'bg-success' : 'bg-outline',
                  )}
                >
                  <span className="text-3xl font-bold tabular-nums leading-none">{horaCorta(r.hora)}</span>
                  <span className="text-xs font-medium capitalize opacity-90">{formatoFecha(r.fecha, 'EEE d MMM')}</span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-on-surface">{numeroReserva(r.id)}</p>
                      <span className={cx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', CHIP_ESTADO[estado])}>
                        {ETIQUETA_ESTADO[estado]}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">store</span>
                      {sucursal?.nombre ?? 'Sucursal'} · {sucursal?.ubicacion}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      {r.detalles.slice(0, 5).map((d) => {
                        const f = foto(d)
                        return (
                          <div
                            key={d.id}
                            className="h-11 w-9 overflow-hidden rounded-md bg-surface-container"
                            title={d.producto_sucursal?.producto?.nombre}
                          >
                            {f ? (
                              <img src={f} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-primary/40">
                                <span className="material-symbols-outlined text-[16px]">checkroom</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                      <span className="ml-1 text-xs text-on-surface-variant">
                        {unidades} {unidades === 1 ? 'prenda' : 'prendas'}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" className="btn-secundario" onClick={() => alternar(r)}>
                      {expandida === r.id ? 'Ocultar' : 'Ver detalle'}
                    </button>
                    {estado === 'pendiente' && (
                      <button
                        type="button"
                        className="btn-secundario border-error text-error hover:bg-error/5"
                        onClick={() => pedirCancelar(r)}
                      >
                        Cancelar reserva
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {expandida === r.id && (
                <ul className="divide-y divide-outline-variant border-t border-outline-variant bg-surface-container-low px-4">
                  {r.detalles.map((d) => {
                    const f = foto(d)
                    return (
                      <li key={d.id} className="flex items-center gap-3 py-2.5 text-sm">
                        <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-surface-container">
                          {f && <img src={f} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-on-surface">{d.producto_sucursal?.producto?.nombre}</p>
                          <p className="text-xs text-on-surface-variant">
                            Talla {referencias.nombre('tallas', d.producto_sucursal?.producto?.talla_id)} ·{' '}
                            {referencias.nombre('colores', d.producto_sucursal?.producto?.color_id)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">x{d.cantidad}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-on-surface">Mis reservas</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Las prendas que apartaste para probarte en la tienda.</p>
        </div>
        <Link to="/reservas/nueva" className="btn-primario">
          <span className="material-symbols-outlined text-[18px]">add</span> Nueva reserva
        </Link>
      </div>

      <nav className="mb-6 flex gap-6 border-b border-outline-variant" role="tablist">
        <button type="button" role="tab" className={clasePestana(pestana === 'proximas')} onClick={() => setPestana('proximas')}>
          Próximas{' '}
          {!cargando && (
            <span className="ml-1 rounded-full bg-surface-container px-2 py-0.5 text-[11px]">{proximas.length}</span>
          )}
        </button>
        <button type="button" role="tab" className={clasePestana(pestana === 'historial')} onClick={() => setPestana('historial')}>
          Historial{' '}
          {!cargando && (
            <span className="ml-1 rounded-full bg-surface-container px-2 py-0.5 text-[11px]">{historial.length}</span>
          )}
        </button>
      </nav>

      {contenido}

      {aCancelar && (
        <ModalConfirmacion
          titulo={'¿Cancelar la reserva ' + numeroReserva(aCancelar.id) + '?'}
          mensaje="La sucursal dejará de preparar tus prendas. Puedes volver a reservar cuando quieras."
          textoBoton="Cancelar reserva"
          error={errorCancelar}
          cargando={cancelando}
          onConfirmar={cancelar}
          onCancelar={() => setACancelar(null)}
        />
      )}
    </>
  )
}
