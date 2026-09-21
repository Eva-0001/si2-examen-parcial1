import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { productosService } from '../services/productos.service'
import { cargarReferencias, useReferencias } from '@/core/stores/referencias.store'
import { toast } from '@/core/stores/toast.store'
import Tabla from '@/shared/components/Tabla'
import Miniatura from '@/shared/components/Miniatura'
import ChipsProducto from '@/shared/components/ChipsProducto'
import ModalConfirmacion from '@/shared/components/ModalConfirmacion'
import { monedaBs } from '@/shared/utils/moneda-bs'

const FILTROS = [
  { campo: 'categoria_id', recurso: 'categorias', etiqueta: 'Categoría' },
  { campo: 'coleccion_id', recurso: 'colecciones', etiqueta: 'Colección' },
  { campo: 'color_id', recurso: 'colores', etiqueta: 'Color' },
  { campo: 'talla_id', recurso: 'tallas', etiqueta: 'Talla' },
  { campo: 'temporada_id', recurso: 'temporadas', etiqueta: 'Temporada' },
]

export default function ProductosAdmin() {
  const referencias = useReferencias()

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [productos, setProductos] = useState([])

  const [busqueda, setBusqueda] = useState('')
  const [seleccion, setSeleccion] = useState({})

  const texto = busqueda.trim().toLowerCase()
  const filtrados = productos.filter(
    (p) =>
      (!texto || p.nombre.toLowerCase().includes(texto)) &&
      FILTROS.every((f) => seleccion[f.campo] == null || p[f.campo] === seleccion[f.campo]),
  )

  const hayFiltros = busqueda.trim() !== '' || Object.values(seleccion).some((v) => v != null)

  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState(null)

  const pedir = useCallback(() => {
    Promise.all([productosService.listar(), cargarReferencias()])
      .then(([lista]) => {
        setProductos([...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))
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

  const cambiarFiltro = (campo, valor) => setSeleccion((s) => ({ ...s, [campo]: valor === '' ? null : Number(valor) }))

  const limpiarFiltros = () => {
    setBusqueda('')
    setSeleccion({})
  }

  const pedirEliminar = (producto) => {
    setErrorEliminar(null)
    setAEliminar(producto)
  }

  const eliminar = () => {
    const producto = aEliminar
    if (!producto) return

    setEliminando(true)
    productosService
      .eliminar(producto.id)
      .then(() => {
        setProductos((lista) => lista.filter((p) => p.id !== producto.id))
        setEliminando(false)
        setAEliminar(null)
        toast.exito('Producto eliminado')
      })
      .catch((e) => {
        setEliminando(false)
        setErrorEliminar(e.message)
      })
  }

  return (
    <>
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Productos</h1>
          </div>
          <Link to="/panel/productos/nuevo" className="btn-primario shrink-0">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo producto
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
              search
            </span>
            <input
              type="search"
              placeholder="Buscar por nombre..."
              className="campo w-56 pl-9"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          {FILTROS.map((filtro) => (
            <div key={filtro.campo} className="relative">
              <select
                className="campo w-40 appearance-none pr-9"
                value={seleccion[filtro.campo] ?? ''}
                onChange={(e) => cambiarFiltro(filtro.campo, e.target.value)}
                aria-label={filtro.etiqueta}
              >
                <option value="">{filtro.etiqueta}: todas</option>
                {referencias.lista(filtro.recurso).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
                expand_more
              </span>
            </div>
          ))}
          {hayFiltros && (
            <button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          )}
        </div>

        <Tabla
          cargando={cargando}
          error={error}
          vacio={filtrados.length === 0}
          filasSkeleton={8}
          iconoVacio="checkroom"
          tituloVacio={hayFiltros ? 'Sin resultados' : 'No hay productos todavía'}
          descripcionVacio={
            hayFiltros ? 'Ningún producto coincide con los filtros.' : 'Carga la primera prenda con su categoría, color y talla.'
          }
          textoAccionVacio={hayFiltros ? 'Limpiar filtros' : null}
          onAccionVacia={limpiarFiltros}
          onReintentar={cargar}
          pie={
            <p>
              {filtrados.length} {filtrados.length === 1 ? 'producto' : 'productos'}
              {hayFiltros ? ` de ${productos.length}` : null}
            </p>
          }
        >
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Atributos</th>
                <th className="text-right">Precio ref.</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((producto) => (
                <tr key={producto.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Miniatura url={productosService.urlFoto(producto)} alt={producto.nombre} />
                      <div>
                        <p className="font-semibold leading-tight">{producto.nombre}</p>
                        <p className="text-xs text-on-surface-variant">#{producto.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <ChipsProducto producto={producto} />
                  </td>
                  <td className="text-right font-medium tabular-nums">{monedaBs(producto.precio)}</td>
                  <td>
                    <div className="acciones-fila">
                      <Link to={`/panel/productos/${producto.id}/editar`} className="btn-icono" title="Editar">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </Link>
                      <button
                        type="button"
                        className="btn-icono-peligro"
                        title="Eliminar"
                        onClick={() => pedirEliminar(producto)}
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tabla>

        {!cargando && !error && productos.length === 0 && (
          <div className="mt-4 text-center">
            <Link to="/panel/productos/nuevo" className="btn-primario">
              Nuevo producto
            </Link>
          </div>
        )}
      </div>

      {aEliminar && (
        <ModalConfirmacion
          titulo={'¿Eliminar ' + aEliminar.nombre + '?'}
          mensaje="Esta acción no se puede deshacer. Si tiene stock cargado en alguna sucursal, no se podrá eliminar."
          error={errorEliminar}
          cargando={eliminando}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </>
  )
}
