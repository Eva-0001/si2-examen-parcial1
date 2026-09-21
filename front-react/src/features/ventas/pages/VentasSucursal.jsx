import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ventasService } from '../services/ventas.service'
import { comprobantesService } from '../services/comprobantes.service'
import { CHIP_TIPO, ETIQUETA_TIPO, fechaDeVenta, numeroVenta, sucursalDeVenta, unidadesDeVenta } from '../ventas.utils'
import { sucursalesService } from '@/features/sucursales/services/sucursales.service'
import { useSucursalActivaStore } from '@/core/stores/sucursal-activa.store'
import Tabla from '@/shared/components/Tabla'
import { formatoFecha } from '@/shared/utils/formato'
import { monedaBs } from '@/shared/utils/moneda-bs'
import { hoyISO } from '@/shared/utils/fechas'
import { cx } from '@/shared/utils/clases'

export default function VentasSucursal() {
  const sucursal = useSucursalActivaStore((s) => s.sucursal)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [sucursales, setSucursales] = useState([])
  const [ventas, setVentas] = useState([])
  const [fechasComprobantes, setFechasComprobantes] = useState(() => new Map())

  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const fechaDe = (v) => fechaDeVenta(v) ?? fechasComprobantes.get(v.id) ?? null

  const deLaSucursal = ventas.filter((v) => sucursalDeVenta(v)?.id === sucursal?.id)

  const filtradas = deLaSucursal
    .filter((v) => {
      if (!desde && !hasta) return true
      const f = fechaDe(v)?.slice(0, 10)
      if (!f) return false
      return (!desde || f >= desde) && (!hasta || f <= hasta)
    })
    .sort((a, b) => b.id - a.id)

  const hayFiltros = desde !== '' || hasta !== ''

  const hoy = hoyISO()
  const deHoy = deLaSucursal.filter((v) => fechaDe(v)?.slice(0, 10) === hoy)
  const resumen = {
    totalHoy: deHoy.reduce((acc, v) => acc + Number(v.total), 0),
    cantidadHoy: deHoy.length,
    cantidad: deLaSucursal.length,
    total: deLaSucursal.reduce((acc, v) => acc + Number(v.total), 0),
    sinFecha: deLaSucursal.filter((v) => !fechaDe(v)).length,
  }

  const pedir = useCallback(() => {
    Promise.all([
      sucursalesService.listar(),
      ventasService.listar().then((lista) => ventasService.obtenerVarias(lista.map((v) => v.id))),
      comprobantesService.listar().catch(() => []),
    ])
      .then(([listaSucursales, listaVentas, comprobantes]) => {
        setSucursales(listaSucursales)
        const activa = useSucursalActivaStore.getState()
        if (!activa.sucursal && listaSucursales.length > 0) activa.seleccionar(listaSucursales[0])
        setVentas(listaVentas)
        const fechas = new Map()
        for (const c of [...comprobantes].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
          if (!fechas.has(c.venta_id)) fechas.set(c.venta_id, c.fecha)
        }
        setFechasComprobantes(fechas)
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

  const clienteDe = (v) => (v.usuario ? `${v.usuario.nombre} ${v.usuario.apellido}` : `Usuario #${v.usuario_id}`)

  const cambiarSucursal = (valor) => {
    const s = sucursales.find((x) => x.id === Number(valor))
    if (s) useSucursalActivaStore.getState().seleccionar(s)
  }

  const limpiarFiltros = () => {
    setDesde('')
    setHasta('')
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Ventas de mi sucursal</h1>
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

      {!cargando && !error && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="tarjeta py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Facturado hoy</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">{monedaBs(resumen.totalHoy)}</p>
            </div>
            <div className="tarjeta py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Ventas de hoy</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-on-surface">{resumen.cantidadHoy}</p>
            </div>
            <div className="tarjeta py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Ventas históricas</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-on-surface">{resumen.cantidad}</p>
            </div>
            <div className="tarjeta py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Total histórico</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-on-surface">{monedaBs(resumen.total)}</p>
            </div>
          </div>
          {resumen.sinFecha > 0 && (
            <p className="mb-4 flex items-start gap-2 rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">info</span>
              {resumen.sinFecha} {resumen.sinFecha === 1 ? 'venta no tiene' : 'ventas no tienen'} comprobante emitido, por eso
              no tienen fecha y quedan fuera de los totales del día y del filtro por rango.
            </p>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-on-surface-variant">
              Desde
              <input type="date" className="campo w-40 py-2" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm text-on-surface-variant">
              Hasta
              <input type="date" className="campo w-40 py-2" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </label>
            {hayFiltros && (
              <button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={limpiarFiltros}>
                Limpiar
              </button>
            )}
          </div>
        </>
      )}

      <Tabla
        cargando={cargando}
        error={error}
        vacio={filtradas.length === 0}
        filasSkeleton={6}
        iconoVacio="receipt_long"
        tituloVacio={hayFiltros ? 'Sin ventas en ese rango' : 'Esta sucursal todavía no tiene ventas'}
        descripcionVacio={
          hayFiltros
            ? 'Prueba con otras fechas.'
            : 'Las compras retiradas aquí y las ventas de caja van a aparecer en esta lista.'
        }
        textoAccionVacio={hayFiltros ? 'Limpiar filtro' : null}
        onAccionVacia={limpiarFiltros}
        onReintentar={cargar}
        pie={
          <p>
            {filtradas.length} {filtradas.length === 1 ? 'venta' : 'ventas'} en {sucursal?.nombre}
          </p>
        }
      >
        <table>
          <thead>
            <tr>
              <th>Número</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th className="text-center">Unidades</th>
              <th className="text-right">Total</th>
              <th className="text-right"></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((v) => {
              const fecha = fechaDe(v)
              return (
                <tr key={v.id}>
                  <td className="font-semibold">{numeroVenta(v.id)}</td>
                  <td className="text-on-surface-variant">{fecha ? formatoFecha(fecha, 'dd/MM/yyyy HH:mm') : '—'}</td>
                  <td>{clienteDe(v)}</td>
                  <td>
                    <span className={cx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', CHIP_TIPO[v.tipo_venta])}>
                      {ETIQUETA_TIPO[v.tipo_venta]}
                    </span>
                  </td>
                  <td className="text-center tabular-nums">{unidadesDeVenta(v)}</td>
                  <td className="text-right font-semibold tabular-nums">{monedaBs(v.total)}</td>
                  <td>
                    <div className="acciones-fila">
                      <Link to={`/panel/ventas/${v.id}`} className="btn-icono" title="Ver detalle">
                        <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Tabla>
    </div>
  )
}
