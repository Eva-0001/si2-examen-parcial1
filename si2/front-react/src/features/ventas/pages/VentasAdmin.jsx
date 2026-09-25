import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ventasService } from '../services/ventas.service'
import { CHIP_TIPO, ETIQUETA_TIPO, numeroVenta, sucursalDeVenta } from '../ventas.utils'
import { bitacoraService } from '@/features/bitacora/services/bitacora.service'
import { usuariosService } from '@/core/services/usuarios.service'
import { cargarReferencias, useReferencias } from '@/core/stores/referencias.store'
import { toast } from '@/core/stores/toast.store'
import Tabla from '@/shared/components/Tabla'
import ModalConfirmacion from '@/shared/components/ModalConfirmacion'
import { formatoFecha } from '@/shared/utils/formato'
import { monedaBs } from '@/shared/utils/moneda-bs'
import { cx } from '@/shared/utils/clases'

const OPCIONES_FILTRO = [
  ['todas', 'Todas'],
  ['virtual', 'Virtuales'],
  ['presencial', 'Presenciales'],
]

export default function VentasAdmin() {
  const referencias = useReferencias()

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [ventas, setVentas] = useState([])
  const [usuarios, setUsuarios] = useState(() => new Map())
  const [fechas, setFechas] = useState(() => new Map())

  const [filtro, setFiltro] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  const [expandida, setExpandida] = useState(null)
  const [detalles, setDetalles] = useState(() => new Map())
  const [cargandoDetalle, setCargandoDetalle] = useState(null)

  const texto = busqueda.trim().toLowerCase()
  const filtradas = ventas
    .filter((v) => {
      if (filtro !== 'todas' && v.tipo_venta !== filtro) return false
      if (!texto) return true
      const u = usuarios.get(v.usuario_id)
      return (
        numeroVenta(v.id).includes(texto) ||
        String(v.id) === texto ||
        `${u?.nombre ?? ''} ${u?.apellido ?? ''} ${u?.username ?? ''} ${u?.correo ?? ''}`.toLowerCase().includes(texto)
      )
    })
    .sort((a, b) => b.id - a.id)

  const hayFiltros = filtro !== 'todas' || busqueda.trim() !== ''

  const resumen = {
    cantidad: filtradas.length,
    total: filtradas.reduce((acc, v) => acc + Number(v.total), 0),
  }

  const [aAnular, setAAnular] = useState(null)
  const [anulando, setAnulando] = useState(false)
  const [errorAnular, setErrorAnular] = useState(null)

  const pedir = useCallback(() => {
    Promise.all([
      ventasService.listar(),
      usuariosService.listar(),
      bitacoraService.fechasDeVentas().catch(() => new Map()),
      cargarReferencias(),
    ])
      .then(([listaVentas, listaUsuarios, mapaFechas]) => {
        setVentas(listaVentas)
        setUsuarios(new Map(listaUsuarios.map((u) => [u.id, u])))
        setFechas(mapaFechas)
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

  const clienteDe = (v) => {
    const u = usuarios.get(v.usuario_id)
    return u ? `${u.nombre} ${u.apellido}` : `Usuario #${v.usuario_id}`
  }

  const fechaDe = (v) => fechas.get(v.id) ?? null

  const alternar = (v) => {
    if (expandida === v.id) {
      setExpandida(null)
      return
    }
    setExpandida(v.id)
    if (detalles.has(v.id)) return

    setCargandoDetalle(v.id)
    ventasService
      .obtener(v.id)
      .then((d) => {
        setDetalles((m) => new Map(m).set(v.id, d))
        setCargandoDetalle(null)
      })
      .catch((e) => {
        setCargandoDetalle(null)
        toast.error(e.message)
      })
  }

  const limpiarFiltros = () => {
    setFiltro('todas')
    setBusqueda('')
  }

  const pedirAnular = (v) => {
    setErrorAnular(null)
    setAAnular(v)
  }

  const anular = () => {
    const v = aAnular
    if (!v) return
    setAnulando(true)
    ventasService
      .anular(v.id)
      .then(() => {
        setVentas((lista) => lista.filter((x) => x.id !== v.id))
        setAnulando(false)
        setAAnular(null)
        toast.exito('Venta anulada, el stock fue devuelto')
      })
      .catch((e) => {
        setAnulando(false)
        setErrorAnular(e.message)
      })
  }

  return (
    <>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Ventas</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                placeholder="Cliente o número de venta..."
                className="campo w-64 pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {OPCIONES_FILTRO.map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  type="button"
                  className={cx(
                    'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                    filtro === valor
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low',
                  )}
                  onClick={() => setFiltro(valor)}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!cargando && !error && (
          <div className="mb-5 grid grid-cols-2 gap-4">
            <div className="tarjeta py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Ventas {hayFiltros ? 'filtradas' : 'registradas'}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-on-surface">{resumen.cantidad}</p>
            </div>
            <div className="tarjeta py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Total facturado</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-on-surface">{monedaBs(resumen.total)}</p>
            </div>
          </div>
        )}

        <Tabla
          cargando={cargando}
          error={error}
          vacio={filtradas.length === 0}
          filasSkeleton={8}
          iconoVacio="receipt_long"
          tituloVacio={hayFiltros ? 'Sin resultados' : 'No hay ventas todavía'}
          descripcionVacio={
            hayFiltros
              ? 'Ninguna venta coincide con los filtros.'
              : 'Las compras de la tienda y del punto de venta van a aparecer aquí.'
          }
          textoAccionVacio={hayFiltros ? 'Limpiar filtros' : null}
          onAccionVacia={limpiarFiltros}
          onReintentar={cargar}
          pie={
            <p>
              {filtradas.length} {filtradas.length === 1 ? 'venta' : 'ventas'}
              {hayFiltros ? ` de ${ventas.length}` : null}
            </p>
          }
        >
          <table>
            <thead>
              <tr>
                <th className="w-10"></th>
                <th>Número</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th className="text-right">Total</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((v) => {
                const fecha = fechaDe(v)
                const d = detalles.get(v.id)
                return (
                  <Fragment key={v.id}>
                    <tr className="cursor-pointer" onClick={() => alternar(v)}>
                      <td className="text-on-surface-variant">
                        <span
                          className={cx(
                            'material-symbols-outlined text-[20px] transition-transform',
                            expandida === v.id && 'rotate-180',
                          )}
                        >
                          expand_more
                        </span>
                      </td>
                      <td className="font-semibold">{numeroVenta(v.id)}</td>
                      <td className="text-on-surface-variant">{fecha ? formatoFecha(fecha, 'dd/MM/yyyy HH:mm') : '—'}</td>
                      <td>{clienteDe(v)}</td>
                      <td>
                        <span className={cx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', CHIP_TIPO[v.tipo_venta])}>
                          {ETIQUETA_TIPO[v.tipo_venta]}
                        </span>
                      </td>
                      <td className="text-right font-semibold tabular-nums">{monedaBs(v.total)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="acciones-fila">
                          <Link to={`/panel/ventas/${v.id}`} className="btn-icono" title="Ver detalle">
                            <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                          </Link>
                          <button
                            type="button"
                            className="btn-icono-peligro"
                            title="Anular venta"
                            onClick={() => pedirAnular(v)}
                          >
                            <span className="material-symbols-outlined text-[20px]">undo</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandida === v.id && (
                      <tr className="bg-surface-container-low">
                        <td colSpan={7} className="py-3">
                          {cargandoDetalle === v.id ? (
                            <div className="flex animate-pulse gap-3">
                              <div className="h-10 flex-1 rounded-lg bg-surface-container"></div>
                            </div>
                          ) : (
                            d && (
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <ul className="flex-1 space-y-1.5 text-sm">
                                  {d.detalles.map((item) => {
                                    const p = item.producto_sucursal?.producto
                                    return (
                                      <li key={item.id} className="flex items-center justify-between gap-3">
                                        <span>
                                          <span className="font-semibold">{item.cantidad} ×</span> {p?.nombre}{' '}
                                          <span className="text-on-surface-variant">
                                            · {referencias.nombre('colores', p?.color_id)} · Talla{' '}
                                            {referencias.nombre('tallas', p?.talla_id)}
                                          </span>
                                        </span>
                                        <span className="tabular-nums">{monedaBs(+item.precio * item.cantidad)}</span>
                                      </li>
                                    )
                                  })}
                                </ul>
                                <div className="shrink-0 text-xs text-on-surface-variant md:text-right">
                                  <p className="flex items-center gap-1 md:justify-end">
                                    <span className="material-symbols-outlined text-[16px]">store</span>
                                    {sucursalDeVenta(d)?.nombre ?? 'Sin sucursal'}
                                  </p>
                                  <p className="mt-1">
                                    {d.comprobantes.length} {d.comprobantes.length === 1 ? 'comprobante' : 'comprobantes'}
                                  </p>
                                  <Link
                                    to={`/panel/ventas/${v.id}`}
                                    className="mt-2 inline-block font-semibold text-primary hover:underline"
                                  >
                                    Ver detalle completo
                                  </Link>
                                </div>
                              </div>
                            )
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </Tabla>
      </div>

      {aAnular && (
        <ModalConfirmacion
          titulo={'¿Anular la venta ' + numeroVenta(aAnular.id) + '?'}
          mensaje="Las unidades vendidas vuelven al stock de la sucursal y queda registrado en la bitácora. Esta acción no se puede deshacer."
          textoBoton="Anular venta"
          error={errorAnular}
          cargando={anulando}
          onConfirmar={anular}
          onCancelar={() => setAAnular(null)}
        />
      )}
    </>
  )
}
