import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ventasService } from '@/features/ventas/services/ventas.service'
import {
  CHIP_TIPO,
  ETIQUETA_TIPO,
  fechaDeVenta,
  numeroVenta,
  sucursalDeVenta,
  unidadesDeVenta,
} from '@/features/ventas/ventas.utils'
import Skeleton from '@/shared/components/Skeleton'
import EstadoVacio from '@/shared/components/EstadoVacio'
import { monedaBs } from '@/shared/utils/moneda-bs'
import { formatoFecha } from '@/shared/utils/formato'
import { cx } from '@/shared/utils/clases'

const FILTROS = [
  ['todas', 'Todas'],
  ['virtual', 'Virtuales'],
  ['presencial', 'Presenciales'],
]

export default function MisPedidos() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [ventas, setVentas] = useState([])
  const [filtro, setFiltro] = useState('todas')

  const pedir = useCallback(() => {
    ventasService
      .listar()
      .then((lista) => ventasService.obtenerVarias(lista.map((v) => v.id)))
      .then((detalles) => {
        setVentas([...detalles].sort((a, b) => b.id - a.id))
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

  const filtradas = ventas.filter((v) => filtro === 'todas' || v.tipo_venta === filtro)
  const conteo = {
    todas: ventas.length,
    virtual: ventas.filter((v) => v.tipo_venta === 'virtual').length,
    presencial: ventas.filter((v) => v.tipo_venta === 'presencial').length,
  }

  let contenido
  if (cargando) {
    contenido = <Skeleton tipo="tabla" cantidad={4} />
  } else if (error) {
    contenido = (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-[32px] text-error">cloud_off</span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface">No pudimos cargar tus pedidos</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{error}</p>
        <button type="button" className="btn-secundario mt-6" onClick={cargar}>
          <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
        </button>
      </div>
    )
  } else if (filtradas.length === 0) {
    contenido = (
      <div className="tarjeta p-0">
        {ventas.length === 0 ? (
          <>
            <EstadoVacio
              icono="shopping_bag"
              titulo="Todavía no tienes pedidos"
              descripcion="Cuando compres en línea o en una de nuestras tiendas, vas a ver el historial aquí."
            />
            <div className="pb-10 text-center">
              <Link to="/catalogo" className="btn-primario">
                Ver catálogo
              </Link>
            </div>
          </>
        ) : (
          <EstadoVacio
            icono="filter_alt_off"
            titulo="Sin pedidos de este tipo"
            textoAccion="Ver todos"
            onAccion={() => setFiltro('todas')}
          />
        )}
      </div>
    )
  } else {
    contenido = (
      <ul className="space-y-3">
        {filtradas.map((v) => {
          const fecha = fechaDeVenta(v)
          const unidades = unidadesDeVenta(v)
          return (
            <li
              key={v.id}
              className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card md:flex-row md:items-center"
            >
              <div className="flex items-center gap-3 md:w-48">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                  <span className="material-symbols-outlined">{v.tipo_venta === 'virtual' ? 'shopping_cart' : 'storefront'}</span>
                </span>
                <div>
                  <p className="font-semibold text-on-surface">{numeroVenta(v.id)}</p>
                  <p className="text-xs text-on-surface-variant">
                    {fecha ? formatoFecha(fecha, 'dd/MM/yyyy') : 'Fecha no registrada'}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span className={cx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', CHIP_TIPO[v.tipo_venta])}>
                  {ETIQUETA_TIPO[v.tipo_venta]}
                </span>
                <span className="text-on-surface-variant">
                  {unidades} {unidades === 1 ? 'producto' : 'productos'}
                </span>
                <span className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">store</span>
                  {sucursalDeVenta(v)?.nombre ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 md:justify-end">
                <span className="text-lg font-bold tabular-nums text-on-surface">{monedaBs(v.total)}</span>
                <Link to={`/pedidos/${v.id}`} className="btn-secundario">
                  Ver detalle
                </Link>
              </div>
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
          <h1 className="text-3xl font-semibold text-on-surface">Mis pedidos</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Tus compras en línea y en tienda.</p>
        </div>
        {!cargando && ventas.length > 0 && (
          <div className="flex gap-2">
            {FILTROS.map(([clave, etiqueta]) => (
              <button
                key={clave}
                type="button"
                className={cx(
                  'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  filtro === clave
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low',
                )}
                onClick={() => setFiltro(clave)}
              >
                {etiqueta} ({conteo[clave]})
              </button>
            ))}
          </div>
        )}
      </div>

      {contenido}
    </>
  )
}
