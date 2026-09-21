import { useCallback, useEffect, useRef, useState } from 'react'
import { stockService } from '../services/stock.service'
import ModalStock from '../components/ModalStock'
import InterruptorBajoStock from '../components/InterruptorBajoStock'
import { productosService } from '@/features/productos/services/productos.service'
import { sucursalesService } from '@/features/sucursales/services/sucursales.service'
import { useSucursalActivaStore } from '@/core/stores/sucursal-activa.store'
import { cargarReferencias, useReferencias } from '@/core/stores/referencias.store'
import { toast } from '@/core/stores/toast.store'
import { nivelStock } from '@/core/models/stock.model'
import Tabla from '@/shared/components/Tabla'
import Miniatura from '@/shared/components/Miniatura'
import ChipsProducto from '@/shared/components/ChipsProducto'
import ModalConfirmacion from '@/shared/components/ModalConfirmacion'
import { useAutofocus } from '@/shared/hooks/useAutofocus'
import { monedaBs } from '@/shared/utils/moneda-bs'
import { cx } from '@/shared/utils/clases'

const CLASE_FILA = {
  alto: '',
  bajo: 'bg-warning/5',
  agotado: 'bg-error/5',
}

const CLASE_CANTIDAD = {
  alto: 'text-on-surface',
  bajo: 'text-warning',
  agotado: 'text-error',
}

export default function StockSucursal() {
  const referencias = useReferencias()
  const sucursal = useSucursalActivaStore((s) => s.sucursal)
  const sucursalId = sucursal?.id ?? null

  const [cargandoBase, setCargandoBase] = useState(true)
  const [cargandoStock, setCargandoStock] = useState(true)
  const [error, setError] = useState(null)
  const [sucursales, setSucursales] = useState([])
  const [productos, setProductos] = useState([])
  const [stock, setStock] = useState([])

  const cargando = sucursalId ? cargandoStock : false

  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState(null)
  const [soloBajo, setSoloBajo] = useState(false)

  const texto = busqueda.trim().toLowerCase()
  const filtrados = stock
    .filter((s) => {
      const p = s.producto
      if (!p) return false
      if (categoriaFiltro !== null && p.categoria_id !== categoriaFiltro) return false
      if (soloBajo && s.cantidad > 10) return false
      return !texto || p.nombre.toLowerCase().includes(texto)
    })
    .sort((a, b) => (a.producto?.nombre ?? '').localeCompare(b.producto?.nombre ?? '', 'es'))

  const hayFiltros = busqueda.trim() !== '' || categoriaFiltro !== null || soloBajo

  const resumen = {
    unidades: stock.reduce((acc, s) => acc + s.cantidad, 0),
    bajos: stock.filter((s) => s.cantidad > 0 && s.cantidad <= 10).length,
    agotados: stock.filter((s) => s.cantidad === 0).length,
  }

  const [editando, setEditandoEstado] = useState(null)
  const editandoRef = useRef(null)
  const fijarEditando = (valor) => {
    editandoRef.current = valor
    setEditandoEstado(valor)
  }
  const [guardandoId, setGuardandoId] = useState(null)
  const autofocusSeleccionar = useAutofocus(true)

  const [modalStock, setModalStock] = useState(undefined)
  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState(null)

  useEffect(() => {
    Promise.all([sucursalesService.listar(), productosService.listar(), cargarReferencias()])
      .then(([listaSucursales, listaProductos]) => {
        setSucursales(listaSucursales)
        setProductos(listaProductos)
        const activa = useSucursalActivaStore.getState()
        if (!activa.sucursal && listaSucursales.length > 0) activa.seleccionar(listaSucursales[0])
        setCargandoBase(false)
      })
      .catch((e) => {
        setError(e.message)
        setCargandoBase(false)
        setCargandoStock(false)
      })
  }, [])

  const pedirStock = useCallback((id, vigente = () => true) => {
    stockService
      .listar({ sucursal_id: id })
      .then((lista) => {
        if (!vigente()) return
        setStock(lista)
        setCargandoStock(false)
      })
      .catch((e) => {
        if (!vigente()) return
        setError(e.message)
        setCargandoStock(false)
      })
  }, [])

  useEffect(() => {
    if (!sucursalId) return
    let vigente = true
    pedirStock(sucursalId, () => vigente)
    return () => {
      vigente = false
    }
  }, [sucursalId, pedirStock])

  const reiniciarCarga = () => {
    setCargandoStock(true)
    setError(null)
    fijarEditando(null)
  }

  const cargar = () => {
    if (!sucursalId) return
    reiniciarCarga()
    pedirStock(sucursalId)
  }

  const cambiarSucursal = (valor) => {
    const s = sucursales.find((x) => x.id === Number(valor))
    if (!s) return
    reiniciarCarga()
    useSucursalActivaStore.getState().seleccionar(s)
  }

  const cambiarCategoria = (valor) => setCategoriaFiltro(valor === '' ? null : Number(valor))

  const limpiarFiltros = () => {
    setBusqueda('')
    setCategoriaFiltro(null)
    setSoloBajo(false)
  }

  const empezarEdicion = (s) => {
    if (guardandoId !== null) return
    fijarEditando({ id: s.id, valor: String(s.cantidad) })
  }

  const escribir = (valor) => {
    if (editandoRef.current) fijarEditando({ ...editandoRef.current, valor })
  }

  const cancelarEdicion = () => fijarEditando(null)

  const confirmarEdicion = () => {
    const e = editandoRef.current
    if (!e) return
    fijarEditando(null)

    const actual = stock.find((s) => s.id === e.id)
    const cantidad = Number(e.valor)
    if (!actual || !Number.isInteger(cantidad) || cantidad < 0) {
      toast.error('La cantidad debe ser un entero, cero o más')
      return
    }
    if (cantidad === actual.cantidad) return

    setGuardandoId(e.id)
    stockService
      .actualizar(e.id, { cantidad })
      .then((st) => {
        setStock((lista) => lista.map((s) => (s.id === st.id ? { ...s, cantidad: st.cantidad } : s)))
        setGuardandoId(null)
        toast.exito(`Cantidad actualizada a ${st.cantidad}`)
      })
      .catch((err) => {
        setGuardandoId(null)
        toast.error(err.message)
      })
  }

  const abrirCarga = () => setModalStock(null)
  const abrirEdicion = (s) => setModalStock(s)

  const alGuardar = () => {
    setModalStock(undefined)
    cargar()
  }

  const pedirEliminar = (s) => {
    setErrorEliminar(null)
    setAEliminar(s)
  }

  const eliminar = () => {
    const s = aEliminar
    if (!s) return

    setEliminando(true)
    stockService
      .eliminar(s.id)
      .then(() => {
        setStock((lista) => lista.filter((x) => x.id !== s.id))
        setEliminando(false)
        setAEliminar(null)
        toast.exito('Stock eliminado')
      })
      .catch((e) => {
        setEliminando(false)
        setErrorEliminar(e.message)
      })
  }

  return (
    <>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Stock de mi sucursal</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                store
              </span>
              <select
                className="campo w-60 appearance-none pl-9 pr-9 font-semibold"
                value={sucursal?.id ?? ''}
                onChange={(e) => cambiarSucursal(e.target.value)}
                disabled={cargandoBase}
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
            <button type="button" className="btn-primario" onClick={abrirCarga} disabled={!sucursal}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Cargar stock
            </button>
          </div>
        </div>

        {!cargando && !error && sucursal && (
          <>
            <div className="mb-5 grid grid-cols-3 gap-4">
              <div className="tarjeta py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Unidades en tienda</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-on-surface">{resumen.unidades}</p>
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
                  className="campo w-48 appearance-none pr-9"
                  value={categoriaFiltro ?? ''}
                  onChange={(e) => cambiarCategoria(e.target.value)}
                  aria-label="Categoría"
                >
                  <option value="">Todas las categorías</option>
                  {referencias.lista('categorias').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
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
            </div>
          </>
        )}

        {!cargandoBase && sucursales.length === 0 ? (
          <div className="tarjeta py-12 text-center">
            <span className="material-symbols-outlined text-[40px] text-primary/40">store</span>
            <h3 className="mt-2 text-lg font-semibold text-on-surface">No hay sucursales registradas</h3>
            <p className="mt-1 text-sm text-on-surface-variant">El administrador debe crear al menos una sucursal.</p>
          </div>
        ) : (
          <Tabla
            cargando={cargando}
            error={error}
            vacio={filtrados.length === 0}
            filasSkeleton={8}
            iconoVacio="inventory_2"
            tituloVacio={hayFiltros ? 'Sin resultados' : 'Esta sucursal no tiene stock cargado'}
            descripcionVacio={
              hayFiltros
                ? 'Ningún producto coincide con los filtros.'
                : 'Carga el primer producto con su cantidad y su precio de venta en esta tienda.'
            }
            textoAccionVacio={hayFiltros ? 'Limpiar filtros' : 'Cargar stock'}
            onAccionVacia={() => (hayFiltros ? limpiarFiltros() : abrirCarga())}
            onReintentar={cargar}
            pie={
              <p>
                {filtrados.length} {filtrados.length === 1 ? 'producto' : 'productos'}
                {hayFiltros ? ` de ${stock.length}` : null} en {sucursal?.nombre}
              </p>
            }
          >
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Talla y color</th>
                  <th className="text-center">Cantidad</th>
                  <th className="text-right">Precio en tienda</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((s) => {
                  const nivel = nivelStock(s.cantidad)
                  return (
                    <tr key={s.id} className={CLASE_FILA[nivel] || undefined}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Miniatura
                            url={s.producto ? productosService.urlFoto(s.producto) : null}
                            alt={s.producto?.nombre ?? ''}
                          />
                          <div>
                            <p className="font-semibold leading-tight">{s.producto?.nombre}</p>
                            <p className="text-xs text-on-surface-variant">
                              {referencias.nombre('categorias', s.producto?.categoria_id) ?? ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>{s.producto && <ChipsProducto producto={s.producto} mostrar={['talla', 'color']} />}</td>
                      <td className="text-center">
                        {editando?.id === s.id ? (
                          <input
                            ref={autofocusSeleccionar}
                            type="number"
                            min="0"
                            step="1"
                            className="campo mx-auto w-24 py-1.5 text-center tabular-nums"
                            value={editando.valor}
                            onChange={(e) => escribir(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') confirmarEdicion()
                              else if (e.key === 'Escape') cancelarEdicion()
                            }}
                            onBlur={confirmarEdicion}
                          />
                        ) : (
                          <button
                            type="button"
                            className={cx(
                              'inline-flex min-w-16 items-center justify-center gap-1 rounded-lg border border-transparent px-3 py-1.5 text-base font-bold tabular-nums transition-colors hover:border-primary hover:bg-surface-container-lowest',
                              CLASE_CANTIDAD[nivel],
                            )}
                            disabled={guardandoId === s.id}
                            title="Clic para editar"
                            onClick={() => empezarEdicion(s)}
                          >
                            {guardandoId === s.id ? (
                              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                            ) : (
                              <>
                                {s.cantidad}
                                <span className="material-symbols-outlined text-[14px] opacity-40">edit</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="text-right font-medium tabular-nums">{monedaBs(s.precio)}</td>
                      <td>
                        <div className="acciones-fila">
                          <button
                            type="button"
                            className="btn-icono"
                            title="Editar cantidad y precio"
                            onClick={() => abrirEdicion(s)}
                          >
                            <span className="material-symbols-outlined text-[20px]">sell</span>
                          </button>
                          <button
                            type="button"
                            className="btn-icono-peligro"
                            title="Quitar de esta sucursal"
                            onClick={() => pedirEliminar(s)}
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Tabla>
        )}
      </div>

      {modalStock !== undefined && sucursal && (
        <ModalStock
          productos={productos}
          sucursales={sucursales}
          existente={modalStock ?? null}
          sucursalInicial={sucursal.id}
          sucursalFija
          onCerrar={() => setModalStock(undefined)}
          onGuardado={alGuardar}
        />
      )}

      {aEliminar && (
        <ModalConfirmacion
          titulo={'¿Quitar ' + (aEliminar.producto?.nombre ?? 'el producto') + ' de esta sucursal?'}
          mensaje="Se elimina el registro de stock y el precio de esta tienda. Si tiene ventas o reservas asociadas, no se podrá eliminar."
          error={errorEliminar}
          cargando={eliminando}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </>
  )
}
