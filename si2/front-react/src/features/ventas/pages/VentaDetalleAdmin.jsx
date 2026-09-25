import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ventasService } from '../services/ventas.service'
import { comprobantesService } from '../services/comprobantes.service'
import { CHIP_TIPO, ETIQUETA_TIPO, fechaDeVenta, numeroVenta } from '../ventas.utils'
import ResumenVenta from '../components/ResumenVenta'
import ModalComprobante from '../components/ModalComprobante'
import { bitacoraService } from '@/features/bitacora/services/bitacora.service'
import { authActual, useAuth } from '@/core/stores/auth.store'
import { toast } from '@/core/stores/toast.store'
import Skeleton from '@/shared/components/Skeleton'
import ModalConfirmacion from '@/shared/components/ModalConfirmacion'
import { formatoFecha } from '@/shared/utils/formato'
import { monedaBs } from '@/shared/utils/moneda-bs'
import { cx } from '@/shared/utils/clases'

export default function VentaDetalleAdmin() {
  const { id } = useParams()
  return <Detalle key={id} id={Number(id)} />
}

function Detalle({ id }) {
  const auth = useAuth()
  const navigate = useNavigate()

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [venta, setVenta] = useState(null)
  const [fechaBitacora, setFechaBitacora] = useState(null)
  const fecha = venta ? (fechaDeVenta(venta) ?? fechaBitacora) : null

  const [modalComprobante, setModalComprobante] = useState(undefined)
  const [comprobanteAEliminar, setComprobanteAEliminar] = useState(null)
  const [eliminandoComprobante, setEliminandoComprobante] = useState(false)
  const [errorEliminarComprobante, setErrorEliminarComprobante] = useState(null)

  const [confirmarAnular, setConfirmarAnular] = useState(false)
  const [anulando, setAnulando] = useState(false)
  const [errorAnular, setErrorAnular] = useState(null)
  const [cambiandoTipo, setCambiandoTipo] = useState(false)

  const puedeEmitir = auth.esAdmin || auth.esCajero

  const pedir = useCallback(() => {
    Promise.all([
      ventasService.obtener(id),
      authActual().esAdmin ? bitacoraService.fechasDeVentas().catch(() => new Map()) : Promise.resolve(new Map()),
    ])
      .then(([v, fechas]) => {
        setVenta(v)
        setFechaBitacora(fechas.get(id) ?? null)
        setCargando(false)
      })
      .catch((e) => {
        setError(e.status === 404 ? 'La venta no existe o fue anulada.' : e.message)
        setCargando(false)
      })
  }, [id])

  useEffect(() => {
    pedir()
  }, [pedir])

  const corregirTipo = (tipo) => {
    const v = venta
    if (!v || tipo === v.tipo_venta) return
    setCambiandoTipo(true)
    ventasService
      .corregirTipo(v.id, tipo)
      .then((actualizada) => {
        setVenta({ ...v, tipo_venta: actualizada.tipo_venta })
        setCambiandoTipo(false)
        toast.exito('Tipo de venta corregido')
      })
      .catch((e) => {
        setCambiandoTipo(false)
        toast.error(e.message)
      })
  }

  const alGuardarComprobante = (c) => {
    setVenta((v) => {
      if (!v) return v
      const existe = v.comprobantes.some((x) => x.id === c.id)
      return { ...v, comprobantes: existe ? v.comprobantes.map((x) => (x.id === c.id ? c : x)) : [...v.comprobantes, c] }
    })
    setModalComprobante(undefined)
  }

  const pedirEliminarComprobante = (c) => {
    setErrorEliminarComprobante(null)
    setComprobanteAEliminar(c)
  }

  const eliminarComprobante = () => {
    const c = comprobanteAEliminar
    if (!c || !venta) return
    setEliminandoComprobante(true)
    comprobantesService
      .eliminar(c.id)
      .then(() => {
        setVenta((v) => ({ ...v, comprobantes: v.comprobantes.filter((x) => x.id !== c.id) }))
        setEliminandoComprobante(false)
        setComprobanteAEliminar(null)
        toast.exito('Comprobante eliminado')
      })
      .catch((e) => {
        setEliminandoComprobante(false)
        setErrorEliminarComprobante(e.message)
      })
  }

  const anular = () => {
    if (!venta) return
    setAnulando(true)
    ventasService
      .anular(venta.id)
      .then(() => {
        toast.exito('Venta anulada, el stock fue devuelto')
        navigate('/panel/ventas')
      })
      .catch((e) => {
        setAnulando(false)
        setErrorAnular(e.message)
      })
  }

  let contenido = null
  if (cargando) {
    contenido = <Skeleton tipo="bloque" />
  } else if (error) {
    contenido = (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <span className="material-symbols-outlined text-[48px] text-error">error</span>
        <h1 className="mt-2 text-xl font-semibold text-on-surface">{error}</h1>
        <Link to="/panel/ventas" className="btn-secundario mt-6">
          Volver a la lista
        </Link>
      </div>
    )
  } else if (venta) {
    const v = venta
    const u = v.usuario
    contenido = (
      <>
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Venta</p>
            <h1 className="text-3xl font-semibold text-on-surface">{numeroVenta(v.id)}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
              <span className={cx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', CHIP_TIPO[v.tipo_venta])}>
                {ETIQUETA_TIPO[v.tipo_venta]}
              </span>
              {fecha ? formatoFecha(fecha, "d 'de' MMMM 'de' yyyy, HH:mm") : 'Fecha no registrada'}
              {u ? ` · ${u.nombre} ${u.apellido} (@${u.username})` : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="mr-2 text-3xl font-bold tabular-nums text-on-surface">{monedaBs(v.total)}</p>
            {puedeEmitir && (
              <button type="button" className="btn-primario no-imprimir" onClick={() => setModalComprobante(null)}>
                <span className="material-symbols-outlined text-[18px]">receipt</span> Emitir comprobante
              </button>
            )}
            {auth.esAdmin && (
              <>
                <div className="no-imprimir relative">
                  <select
                    className="campo w-44 appearance-none py-2 pr-9 text-xs"
                    value={v.tipo_venta}
                    disabled={cambiandoTipo}
                    onChange={(e) => corregirTipo(e.target.value)}
                    aria-label="Corregir tipo"
                  >
                    <option value="virtual">Tipo: virtual</option>
                    <option value="presencial">Tipo: presencial</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
                    expand_more
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-secundario no-imprimir border-error text-error hover:bg-error/5"
                  onClick={() => setConfirmarAnular(true)}
                >
                  <span className="material-symbols-outlined text-[18px]">undo</span> Anular
                </button>
              </>
            )}
          </div>
        </header>

        <ResumenVenta venta={v} fecha={fecha} />

        {puedeEmitir && v.comprobantes.length > 0 && (
          <section className="no-imprimir mt-6 tarjeta">
            <h2 className="mb-3 text-sm font-semibold text-on-surface">Gestionar comprobantes</h2>
            <ul className="divide-y divide-outline-variant">
              {v.comprobantes.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    <span className="font-semibold">{c.nombre}</span>
                    <span className="text-on-surface-variant">
                      · {formatoFecha(c.fecha, 'dd/MM/yyyy HH:mm')} · {monedaBs(c.monto)}
                    </span>
                  </span>
                  <span className="acciones-fila">
                    <button type="button" className="btn-icono" title="Editar" onClick={() => setModalComprobante(c)}>
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn-icono-peligro"
                      title="Eliminar"
                      onClick={() => pedirEliminarComprobante(c)}
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-[1200px]">
        <Link
          to="/panel/ventas"
          className="no-imprimir mb-4 inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Volver a ventas
        </Link>

        {contenido}
      </div>

      {modalComprobante !== undefined && venta && (
        <ModalComprobante
          ventaFija={venta}
          existente={modalComprobante ?? null}
          cantidadEmitidos={venta.comprobantes.length}
          onCerrar={() => setModalComprobante(undefined)}
          onGuardado={alGuardarComprobante}
        />
      )}

      {comprobanteAEliminar && (
        <ModalConfirmacion
          titulo={'¿Eliminar ' + comprobanteAEliminar.nombre + '?'}
          mensaje="Esta acción no se puede deshacer."
          error={errorEliminarComprobante}
          cargando={eliminandoComprobante}
          onConfirmar={eliminarComprobante}
          onCancelar={() => setComprobanteAEliminar(null)}
        />
      )}

      {confirmarAnular && venta && (
        <ModalConfirmacion
          titulo={'¿Anular la venta ' + numeroVenta(venta.id) + '?'}
          mensaje="Las unidades vendidas vuelven al stock de la sucursal y queda registrado en la bitácora. Esta acción no se puede deshacer."
          textoBoton="Anular venta"
          error={errorAnular}
          cargando={anulando}
          onConfirmar={anular}
          onCancelar={() => setConfirmarAnular(false)}
        />
      )}
    </>
  )
}
