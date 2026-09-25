import { useCallback, useEffect, useState } from 'react'
import { stockService } from '../services/stock.service'
import ModalStock from '../components/ModalStock'
import InterruptorBajoStock from '../components/InterruptorBajoStock'
import { productosService } from '@/features/productos/services/productos.service'
import { sucursalesService } from '@/features/sucursales/services/sucursales.service'
import { cargarReferencias } from '@/core/stores/referencias.store'
import { nivelStock } from '@/core/models/stock.model'
import Skeleton from '@/shared/components/Skeleton'
import EstadoVacio from '@/shared/components/EstadoVacio'
import Miniatura from '@/shared/components/Miniatura'
import ChipsProducto from '@/shared/components/ChipsProducto'
import { cx } from '@/shared/utils/clases'

const CLASE_CELDA = {
  alto: 'bg-success/10 text-success',
  bajo: 'bg-warning/10 text-warning',
  agotado: 'bg-error/10 text-error',
}

export default function InventarioGlobal() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [productos, setProductos] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [stock, setStock] = useState([])

  const matriz = new Map(stock.map((s) => [`${s.producto_id}-${s.sucursal_id}`, s]))
  const celda = (p, s) => matriz.get(`${p.id}-${s.id}`)

  const [busqueda, setBusqueda] = useState('')
  const [sucursalFiltro, setSucursalFiltro] = useState(null)
  const [soloBajo, setSoloBajo] = useState(false)

  const columnas = sucursalFiltro === null ? sucursales : sucursales.filter((s) => s.id === sucursalFiltro)

  const texto = busqueda.trim().toLowerCase()
  const filas = productos.filter((p) => {
    if (texto && !p.nombre.toLowerCase().includes(texto)) return false
    if (!soloBajo) return true
    return columnas.some((s) => {
      const c = celda(p, s)
      return !c || c.cantidad <= 10
    })
  })

  const hayFiltros = busqueda.trim() !== '' || sucursalFiltro !== null || soloBajo

  const resumen = {
    registros: stock.length,
    unidades: stock.reduce((acc, s) => acc + s.cantidad, 0),
    agotados: stock.filter((s) => s.cantidad === 0).length,
    bajos: stock.filter((s) => s.cantidad > 0 && s.cantidad <= 10).length,
  }

  const [modal, setModal] = useState(null)

  const pedir = useCallback(() => {
    Promise.all([productosService.listar(), sucursalesService.listar(), stockService.listar(), cargarReferencias()])
      .then(([listaProductos, listaSucursales, listaStock]) => {
        setProductos([...listaProductos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))
        setSucursales(listaSucursales)
        setStock(listaStock)
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

  const totalFila = (p) => columnas.reduce((acc, s) => acc + (celda(p, s)?.cantidad ?? 0), 0)

  const cambiarSucursal = (valor) => setSucursalFiltro(valor === '' ? null : Number(valor))

  const limpiarFiltros = () => {
    setBusqueda('')
    setSucursalFiltro(null)
    setSoloBajo(false)
  }

  const abrirCelda = (p, s) => setModal({ existente: celda(p, s) ?? null, productoId: p.id, sucursalId: s.id })
  const abrirNuevo = () => setModal({ existente: null, productoId: null, sucursalId: sucursalFiltro })

  const alGuardar = (fila) => {
    setStock((lista) =>
      lista.some((s) => s.id === fila.id) ? lista.map((s) => (s.id === fila.id ? { ...s, ...fila } : s)) : [...lista, fila],
    )
    setModal(null)
  }

  let contenido
  if (cargando) {
    contenido = <Skeleton tipo="tabla" cantidad={8} />
  } else if (error) {
    contenido = (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-[32px] text-error">cloud_off</span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface">No pudimos cargar el inventario</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{error}</p>
        <button type="button" className="btn-secundario mt-6" onClick={cargar}>
          <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
        </button>
      </div>
    )
  } else if (sucursales.length === 0 || productos.length === 0) {
    contenido = (
      <div className="tarjeta p-0">
        <EstadoVacio
          icono="analytics"
          titulo={sucursales.length === 0 ? 'Primero registra sucursales' : 'Primero carga productos'}
          descripcion="La matriz cruza productos con sucursales: necesita al menos uno de cada lado."
        />
      </div>
    )
  } else if (filas.length === 0) {
    contenido = (
      <div className="tarjeta p-0">
        <EstadoVacio
          icono="search_off"
          titulo="Sin resultados"
          descripcion="Ningún producto coincide con los filtros."
          textoAccion="Limpiar filtros"
          onAccion={limpiarFiltros}
        />
      </div>
    )
  } else {
    contenido = (
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card">
        <div className="tabla max-h-[70vh] overflow-auto">
          <table>
            <thead>
              <tr>
                <th className="sticky left-0 z-[2] min-w-[260px] bg-surface-container-low">Producto</th>
                {columnas.map((s) => (
                  <th key={s.id} className="min-w-[120px] text-center">
                    {s.nombre}
                  </th>
                ))}
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((p) => (
                <tr key={p.id}>
                  <td className="sticky left-0 z-[1] bg-surface-container-lowest">
                    <div className="flex items-center gap-3">
                      <Miniatura url={productosService.urlFoto(p)} alt={p.nombre} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold leading-tight">{p.nombre}</p>
                        <ChipsProducto producto={p} mostrar={['talla', 'color']} />
                      </div>
                    </div>
                  </td>
                  {columnas.map((s) => {
                    const st = celda(p, s)
                    return (
                      <td key={s.id} className="p-1.5 text-center">
                        {st ? (
                          <button
                            type="button"
                            className={cx(
                              'flex w-full flex-col items-center rounded-lg px-2 py-1.5 transition-opacity hover:opacity-80',
                              CLASE_CELDA[nivelStock(st.cantidad)],
                            )}
                            title={'Precio en ' + s.nombre + ': Bs ' + st.precio + '. Clic para editar'}
                            onClick={() => abrirCelda(p, s)}
                          >
                            <span className="text-base font-bold tabular-nums leading-tight">{st.cantidad}</span>
                            <span className="text-[10px] opacity-80">Bs {st.precio}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="flex w-full items-center justify-center rounded-lg border border-dashed border-outline-variant px-2 py-3 text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                            title="Sin stock cargado. Clic para cargar"
                            onClick={() => abrirCelda(p, s)}
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </button>
                        )}
                      </td>
                    )
                  })}
                  <td className="text-right font-semibold tabular-nums">{totalFila(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-outline-variant px-6 py-3 text-xs text-on-surface-variant">
          {filas.length} {filas.length === 1 ? 'producto' : 'productos'} × {columnas.length}{' '}
          {columnas.length === 1 ? 'sucursal' : 'sucursales'}
        </footer>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Inventario global</h1>
          </div>
          <button type="button" className="btn-primario shrink-0" onClick={abrirNuevo} disabled={cargando || !!error}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            Cargar stock
          </button>
        </div>

        {!cargando && !error && (
          <>
            <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="tarjeta py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Unidades</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-on-surface">{resumen.unidades}</p>
              </div>
              <div className="tarjeta py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Registros</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-on-surface">{resumen.registros}</p>
              </div>
              <div className="tarjeta py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-warning">Bajo stock</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-warning">{resumen.bajos}</p>
              </div>
              <div className="tarjeta py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-error">Agotados</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-error">{resumen.agotados}</p>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                  search
                </span>
                <input
                  type="search"
                  placeholder="Buscar producto..."
                  className="campo w-56 pl-9"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <div className="relative">
                <select
                  className="campo w-56 appearance-none pr-9"
                  value={sucursalFiltro ?? ''}
                  onChange={(e) => cambiarSucursal(e.target.value)}
                  aria-label="Sucursal"
                >
                  <option value="">Todas las sucursales</option>
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
              <InterruptorBajoStock activo={soloBajo} onCambiar={setSoloBajo} />
              {hayFiltros && (
                <button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={limpiarFiltros}>
                  Limpiar filtros
                </button>
              )}
              <div className="ml-auto flex items-center gap-3 text-[11px] text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded bg-success/20"></span> más de 10
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded bg-warning/20"></span> 1 a 10
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded bg-error/20"></span> agotado
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded border border-outline-variant"></span> sin cargar
                </span>
              </div>
            </div>
          </>
        )}

        {contenido}
      </div>

      {modal && (
        <ModalStock
          productos={productos}
          sucursales={sucursales}
          existente={modal.existente}
          productoInicial={modal.productoId}
          sucursalInicial={modal.sucursalId}
          onCerrar={() => setModal(null)}
          onGuardado={alGuardar}
        />
      )}
    </>
  )
}
