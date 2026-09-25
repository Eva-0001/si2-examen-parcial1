import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ventasService } from '@/features/ventas/services/ventas.service'
import { numeroVenta, sucursalDeVenta, unidadesDeVenta } from '@/features/ventas/ventas.utils'
import { cargarReferencias, useReferencias } from '@/core/stores/referencias.store'
import Skeleton from '@/shared/components/Skeleton'
import { monedaBs } from '@/shared/utils/moneda-bs'

export default function CompraExitosa() {
  const { id } = useParams()
  const referencias = useReferencias()

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [venta, setVenta] = useState(null)

  const [idCargado, setIdCargado] = useState(id)
  if (idCargado !== id) {
    setIdCargado(id)
    setCargando(true)
    setError(null)
  }

  useEffect(() => {
    cargarReferencias().catch(() => {})
  }, [])

  useEffect(() => {
    ventasService
      .obtener(Number(id))
      .then((v) => {
        setVenta(v)
        setCargando(false)
      })
      .catch((e) => {
        setError(e.status === 404 || e.status === 403 ? 'No encontramos esa compra.' : e.message)
        setCargando(false)
      })
  }, [id])

  const sucursal = venta ? sucursalDeVenta(venta) : null
  const unidades = venta ? unidadesDeVenta(venta) : 0

  let contenido = null
  if (cargando) {
    contenido = <Skeleton tipo="bloque" />
  } else if (error) {
    contenido = (
      <div className="tarjeta text-center">
        <span className="material-symbols-outlined text-[48px] text-error">error</span>
        <h1 className="mt-2 text-xl font-semibold text-on-surface">{error}</h1>
        <Link to="/pedidos" className="btn-primario mt-6">
          Ver mis pedidos
        </Link>
      </div>
    )
  } else if (venta) {
    const v = venta
    contenido = (
      <div className="tarjeta text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <span className="material-symbols-outlined text-[48px] text-success">check_circle</span>
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-on-surface">¡Gracias por tu compra!</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Tu pedido quedó registrado. Retíralo en la sucursal cuando quieras.
        </p>

        <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-surface-container-low p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Venta</dt>
            <dd className="mt-0.5 text-base font-bold text-on-surface">{numeroVenta(v.id)}</dd>
          </div>
          <div className="rounded-lg bg-surface-container-low p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Total</dt>
            <dd className="mt-0.5 text-base font-bold text-on-surface">{monedaBs(v.total)}</dd>
          </div>
          <div className="rounded-lg bg-surface-container-low p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">Retiro</dt>
            <dd className="mt-0.5 truncate text-sm font-bold text-on-surface">{sucursal?.nombre ?? '—'}</dd>
          </div>
        </dl>

        {v.pago_id && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-success">verified</span>
            Pago aprobado · <span className="font-mono">{v.pago_id}</span>
          </p>
        )}

        <ul className="mt-6 divide-y divide-outline-variant text-left">
          {v.detalles.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <p className="font-semibold text-on-surface">{d.producto_sucursal?.producto?.nombre}</p>
                <p className="text-xs text-on-surface-variant">
                  {referencias.nombre('colores', d.producto_sucursal?.producto?.color_id)} · Talla{' '}
                  {referencias.nombre('tallas', d.producto_sucursal?.producto?.talla_id)} · x{d.cantidad}
                </p>
              </div>
              <span className="font-semibold tabular-nums">{monedaBs(+d.precio * d.cantidad)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-right text-xs text-on-surface-variant">
          {unidades} {unidades === 1 ? 'unidad' : 'unidades'}
        </p>

        <div className="no-imprimir mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" className="btn-secundario flex-1" onClick={() => window.print()}>
            <span className="material-symbols-outlined text-[18px]">download</span>
            Descargar comprobante
          </button>
          <Link to="/catalogo" className="btn-primario flex-1">
            Seguir comprando
          </Link>
        </div>
        <Link to="/pedidos" className="no-imprimir mt-4 block text-xs font-semibold text-primary hover:underline">
          Ver mis pedidos
        </Link>
      </div>
    )
  }

  return <div className="mx-auto max-w-[640px] py-6">{contenido}</div>
}
