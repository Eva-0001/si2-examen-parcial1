import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { productosService } from '../services/productos.service'
import { cargarReferencias, useReferencias } from '@/core/stores/referencias.store'
import Skeleton from '@/shared/components/Skeleton'
import EstadoVacio from '@/shared/components/EstadoVacio'
import ChipsProducto from '@/shared/components/ChipsProducto'
import { monedaBs } from '@/shared/utils/moneda-bs'

const BASE = '/panel/mis-productos'

export default function MisProductos() {
  const referencias = useReferencias()

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [productos, setProductos] = useState([])

  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState(null)
  const [menuAbierto, setMenuAbierto] = useState(null)

  const texto = busqueda.trim().toLowerCase()
  const filtrados = productos.filter(
    (p) =>
      (categoriaFiltro === null || p.categoria_id === categoriaFiltro) &&
      (!texto || p.nombre.toLowerCase().includes(texto)),
  )

  const hayFiltros = busqueda.trim() !== '' || categoriaFiltro !== null

  const pedir = useCallback(() => {
    Promise.all([productosService.listar(), cargarReferencias()])
      .then(([lista]) => {
        setProductos([...lista].sort((a, b) => b.id - a.id))
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

  const cambiarCategoria = (valor) => setCategoriaFiltro(valor === '' ? null : Number(valor))

  const limpiarFiltros = () => {
    setBusqueda('')
    setCategoriaFiltro(null)
  }

  const alternarMenu = (id) => setMenuAbierto((actual) => (actual === id ? null : id))

  let contenido
  if (cargando) {
    contenido = <Skeleton tipo="tarjetas" cantidad={8} />
  } else if (error) {
    contenido = (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-[32px] text-error">cloud_off</span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface">No pudimos cargar los productos</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{error}</p>
        <button type="button" className="btn-secundario mt-6" onClick={cargar}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Reintentar
        </button>
      </div>
    )
  } else if (filtrados.length === 0) {
    contenido = (
      <div className="tarjeta p-0">
        {hayFiltros ? (
          <EstadoVacio
            icono="search_off"
            titulo="Sin resultados"
            descripcion="Ningún producto coincide con los filtros."
            textoAccion="Limpiar filtros"
            onAccion={limpiarFiltros}
          />
        ) : (
          <>
            <EstadoVacio
              icono="checkroom"
              titulo="Todavía no cargaste ningún producto"
              descripcion="Empieza con la primera prenda: nombre, precio, categoría, color, talla y una foto."
            />
            <div className="pb-10 text-center">
              <Link to={`${BASE}/nuevo`} className="btn-primario">
                Nuevo producto
              </Link>
            </div>
          </>
        )}
      </div>
    )
  } else {
    contenido = (
      <>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((producto) => {
            const foto = productosService.urlFoto(producto)
            const rutaEditar = `${BASE}/${producto.id}/editar`
            return (
              <article
                key={producto.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card transition-colors hover:border-primary"
              >
                <Link to={rutaEditar} className="block aspect-square bg-surface-container">
                  {foto ? (
                    <img src={foto} alt={producto.nombre} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-primary/40">
                      <span className="material-symbols-outlined text-[48px]">checkroom</span>
                      <span className="text-[11px] font-medium">Sin foto</span>
                    </div>
                  )}
                </Link>

                <div className="absolute right-2 top-2">
                  <button
                    type="button"
                    className="flex rounded-full bg-surface-container-lowest/90 p-1.5 text-on-surface-variant shadow-card backdrop-blur-sm hover:text-primary"
                    aria-label="Opciones"
                    onClick={() => alternarMenu(producto.id)}
                  >
                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                  </button>
                  {menuAbierto === producto.id && (
                    <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-outline-variant bg-surface-container-lowest py-1.5 shadow-xl">
                      <Link
                        to={rutaEditar}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-container-low"
                        onClick={() => setMenuAbierto(null)}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span> Editar
                      </Link>
                      <Link
                        to={`${rutaEditar}#foto`}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-container-low"
                        onClick={() => setMenuAbierto(null)}
                      >
                        <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span> Subir foto
                      </Link>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-on-surface group-hover:text-primary">
                    {producto.nombre}
                  </h3>
                  <p className="text-base font-bold text-on-surface">{monedaBs(producto.precio)}</p>
                  <ChipsProducto producto={producto} mostrar={['categoria', 'talla', 'color']} />
                </div>
              </article>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-on-surface-variant">
          {filtrados.length} {filtrados.length === 1 ? 'producto' : 'productos'}
          {hayFiltros ? ` de ${productos.length}` : null}
        </p>
      </>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Mis productos</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
            <div className="relative">
              <select
                className="campo w-48 appearance-none pr-9"
                value={categoriaFiltro ?? ''}
                onChange={(e) => cambiarCategoria(e.target.value)}
                aria-label="Filtrar por categoría"
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
            <Link to={`${BASE}/nuevo`} className="btn-primario">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo producto
            </Link>
          </div>
        </div>

        {contenido}
      </div>

      {menuAbierto !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuAbierto(null)} aria-hidden="true"></div>
      )}
    </>
  )
}
