import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ETIQUETA_METODO } from '../pos.utils'
import { ventasService } from '@/features/ventas/services/ventas.service'
import { numeroVenta, sucursalDeVenta, unidadesDeVenta } from '@/features/ventas/ventas.utils'
import { cargarReferencias, useReferencias } from '@/core/stores/referencias.store'
import { useAuth } from '@/core/stores/auth.store'
import { useSucursalActivaStore } from '@/core/stores/sucursal-activa.store'
import Skeleton from '@/shared/components/Skeleton'
import { formatoFecha } from '@/shared/utils/formato'
import { monedaBs } from '@/shared/utils/moneda-bs'

export default function ComprobanteTicket() {
  const { id } = useParams()
  return <Ticket key={id} id={Number(id)} />
}

function Ticket({ id }) {
  const referencias = useReferencias()
  const auth = useAuth()
  const ciudades = useSucursalActivaStore((s) => s.ciudades)
  const cobro = useLocation().state?.cobro ?? null

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [venta, setVenta] = useState(null)

  useEffect(() => {
    cargarReferencias().catch(() => {})
    if (useSucursalActivaStore.getState().ciudades.length === 0) useSucursalActivaStore.getState().cargar()
  }, [])

  useEffect(() => {
    ventasService
      .obtener(id)
      .then((v) => {
        setVenta(v)
        setCargando(false)
      })
      .catch((e) => {
        setError(e.status === 404 ? 'La venta no existe.' : e.message)
        setCargando(false)
      })
  }, [id])

  const sucursal = venta ? sucursalDeVenta(venta) : null
  const unidades = venta ? unidadesDeVenta(venta) : 0
  const comprobante = venta?.comprobantes[0] ?? null
  const ciudad = sucursal ? (ciudades.find((c) => c.id === sucursal.ciudad_id)?.nombre ?? '') : ''

  const imprimir = () => {
    if (typeof window !== 'undefined') window.print()
  }

  let contenido = null
  if (cargando) {
    contenido = <Skeleton tipo="bloque" />
  } else if (error) {
    contenido = (
      <div className="tarjeta text-center">
        <span className="material-symbols-outlined text-[48px] text-error">error</span>
        <p className="mt-2 font-semibold text-on-surface">{error}</p>
        <Link to="/panel/pos" className="btn-primario mt-6">
          Volver al punto de venta
        </Link>
      </div>
    )
  } else if (venta) {
    const v = venta
    const esCliente = v.usuario && v.usuario.id !== auth.usuario?.id
    contenido = (
      <>
        <article className="rounded-xl border border-outline-variant bg-white p-6 font-mono text-[13px] text-on-surface shadow-card print:border-0 print:shadow-none">
          <header className="border-b border-dashed border-outline pb-4 text-center">
            <p className="font-sans text-xl font-bold tracking-tight text-primary">FashionStore</p>
            {sucursal && (
              <>
                <p className="mt-1 font-semibold">{sucursal.nombre}</p>
                <p className="text-on-surface-variant">
                  {sucursal.ubicacion}
                  {ciudad ? ', ' + ciudad : ''}
                </p>
              </>
            )}
          </header>

          <dl className="space-y-1 border-b border-dashed border-outline py-3">
            <div className="flex justify-between">
              <dt className="text-on-surface-variant">Comprobante</dt>
              <dd className="font-semibold">{comprobante?.nombre ?? numeroVenta(v.id)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-on-surface-variant">Venta</dt>
              <dd>{numeroVenta(v.id)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-on-surface-variant">Fecha</dt>
              <dd>{comprobante?.fecha ? formatoFecha(comprobante.fecha, 'dd/MM/yyyy HH:mm') : '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-on-surface-variant">Cajero</dt>
              <dd>
                {auth.usuario?.nombre} {auth.usuario?.apellido}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-on-surface-variant">Cliente</dt>
              <dd>{esCliente ? `${v.usuario.nombre} ${v.usuario.apellido}` : 'Consumidor final'}</dd>
            </div>
          </dl>

          <table className="w-full border-b border-dashed border-outline py-3">
            <thead>
              <tr className="text-left text-[11px] uppercase text-on-surface-variant">
                <th className="py-2 font-medium">Cant.</th>
                <th className="py-2 font-medium">Detalle</th>
                <th className="py-2 text-right font-medium">Importe</th>
              </tr>
            </thead>
            <tbody>
              {v.detalles.map((d) => {
                const p = d.producto_sucursal?.producto
                return (
                  <tr key={d.id} className="align-top">
                    <td className="py-1 pr-2 tabular-nums">{d.cantidad}</td>
                    <td className="py-1 pr-2">
                      {p?.nombre}
                      <span className="block text-[11px] text-on-surface-variant">
                        {referencias.nombre('tallas', p?.talla_id)} · {referencias.nombre('colores', p?.color_id)} ·{' '}
                        {monedaBs(d.precio)} c/u
                      </span>
                    </td>
                    <td className="py-1 text-right tabular-nums">{monedaBs(+d.precio * d.cantidad)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <dl className="space-y-1 py-3">
            <div className="flex justify-between text-on-surface-variant">
              <dt>Unidades</dt>
              <dd className="tabular-nums">{unidades}</dd>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <dt>TOTAL</dt>
              <dd className="tabular-nums">{monedaBs(v.total)}</dd>
            </div>
            {cobro && (
              <>
                <div className="flex justify-between text-on-surface-variant">
                  <dt>Pago</dt>
                  <dd>{ETIQUETA_METODO[cobro.metodo]}</dd>
                </div>
                {cobro.metodo === 'efectivo' && cobro.pagaCon !== null && (
                  <>
                    <div className="flex justify-between text-on-surface-variant">
                      <dt>Paga con</dt>
                      <dd className="tabular-nums">{monedaBs(cobro.pagaCon)}</dd>
                    </div>
                    <div className="flex justify-between font-semibold text-success">
                      <dt>Vuelto</dt>
                      <dd className="tabular-nums">{monedaBs(cobro.vuelto)}</dd>
                    </div>
                  </>
                )}
              </>
            )}
          </dl>

          <footer className="border-t border-dashed border-outline pt-4 text-center text-[11px] text-on-surface-variant">
            <p>¡Gracias por tu compra!</p>
            <p>Cambios dentro de los 15 días con este comprobante.</p>
          </footer>
        </article>

        <div className="no-imprimir mt-5 flex gap-3">
          <button type="button" className="btn-secundario flex-1 py-3" onClick={imprimir}>
            <span className="material-symbols-outlined text-[20px]">print</span> Imprimir
          </button>
          <Link to="/panel/pos" className="btn-primario flex-1 py-3">
            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span> Nueva venta
          </Link>
        </div>
      </>
    )
  }

  return <div className="mx-auto max-w-[420px] py-4">{contenido}</div>
}
