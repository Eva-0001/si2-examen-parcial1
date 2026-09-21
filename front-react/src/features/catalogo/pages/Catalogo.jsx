import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { catalogoService, useCatalogo } from '../services/catalogo.service'
import { useReferencias } from '@/core/stores/referencias.store'
import { useSucursalActivaStore } from '@/core/stores/sucursal-activa.store'
import Skeleton from '@/shared/components/Skeleton'
import EstadoVacio from '@/shared/components/EstadoVacio'
import TarjetaProducto from '@/shared/components/TarjetaProducto'
import { colorDesdeNombre, esColorClaro } from '@/shared/utils/colores'
import { compararTallas } from '@/features/catalogos/catalogos.config'
import { conQuery } from '@/shared/utils/query'
import { cx } from '@/shared/utils/clases'

const RECURSO_DE = {
  categoria: 'categorias',
  coleccion: 'colecciones',
  color: 'colores',
  talla: 'tallas',
  temporada: 'temporadas',
}

const ETIQUETA_DE = {
  categoria: 'Categoría',
  coleccion: 'Colección',
  color: 'Color',
  talla: 'Talla',
  temporada: 'Temporada',
}

const GRUPOS = ['categoria', 'coleccion', 'color', 'talla', 'temporada']
const POR_PAGINA = 12

function leerFiltros(p) {
  const ids = (clave) =>
    (p.get(clave) ?? '')
      .split(',')
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0)
  const orden = p.get('orden')
  return {
    q: p.get('q') ?? '',
    categoria: ids('categoria'),
    coleccion: ids('coleccion'),
    color: ids('color'),
    talla: ids('talla'),
    temporada: ids('temporada'),
    disponibles: p.get('disponibles') === '1',
    orden: orden && ['nuevos', 'precio_asc', 'precio_desc', 'nombre'].includes(orden) ? orden : 'relevancia',
    pagina: Math.max(1, Number(p.get('pagina')) || 1),
  }
}

function ordenar(lista, orden) {
  const copia = [...lista]
  const precio = (g) => g.precioDesde ?? Number.MAX_SAFE_INTEGER
  switch (orden) {
    case 'nuevos':
      return copia.sort((a, b) => b.maxId - a.maxId)
    case 'precio_asc':
      return copia.sort((a, b) => precio(a) - precio(b))
    case 'precio_desc':
      return copia.sort((a, b) => (b.precioDesde ?? -1) - (a.precioDesde ?? -1))
    case 'nombre':
      return copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    default: {
      const peso = (g) => (g.disponibilidad === 'disponible' ? 0 : g.disponibilidad === 'otras' ? 1 : 2)
      return copia.sort((a, b) => peso(a) - peso(b) || b.maxId - a.maxId)
    }
  }
}

export default function Catalogo() {
  const catalogo = useCatalogo()
  const referencias = useReferencias()
  const sucursal = useSucursalActivaStore((s) => s.sucursal)
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [cargando, setCargando] = useState(() => !catalogoService.estaCargado())
  const [error, setError] = useState(null)
  const [abiertos, setAbiertos] = useState(() => new Set(['categoria', 'color', 'talla']))
  const [sidebarMovil, setSidebarMovil] = useState(false)

  const filtros = leerFiltros(searchParams)

  useEffect(() => {
    let vigente = true
    catalogoService
      .cargar()
      .then(() => vigente && setCargando(false))
      .catch((e) => {
        if (!vigente) return
        setError(e.message)
        setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.search])

  const q = filtros.q.trim().toLowerCase()
  const resultados = ordenar(
    catalogo.grupos.filter(
      (g) =>
        (!q || g.nombre.toLowerCase().includes(q)) &&
        (filtros.categoria.length === 0 || (g.categoria_id !== null && filtros.categoria.includes(g.categoria_id))) &&
        (filtros.coleccion.length === 0 || (g.coleccion_id !== null && filtros.coleccion.includes(g.coleccion_id))) &&
        (filtros.temporada.length === 0 || (g.temporada_id !== null && filtros.temporada.includes(g.temporada_id))) &&
        (filtros.color.length === 0 || g.colores.some((c) => filtros.color.includes(c))) &&
        (filtros.talla.length === 0 || g.tallas.some((t) => filtros.talla.includes(t))) &&
        (!filtros.disponibles || g.disponibilidad === 'disponible'),
    ),
    filtros.orden,
  )

  const totalPaginas = Math.max(1, Math.ceil(resultados.length / POR_PAGINA))
  const pagina = Math.min(filtros.pagina, totalPaginas)
  const paginaActual = resultados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1)

  const chips = []
  if (filtros.q.trim()) chips.push({ grupo: 'q', id: null, texto: `"${filtros.q.trim()}"` })
  for (const g of GRUPOS) {
    for (const id of filtros[g]) {
      chips.push({ grupo: g, id, texto: referencias.nombre(RECURSO_DE[g], id) ?? `#${id}` })
    }
  }
  if (filtros.disponibles) {
    chips.push({ grupo: 'disponibles', id: null, texto: `Solo en ${sucursal?.nombre ?? 'mi sucursal'}` })
  }
  const hayFiltros = chips.length > 0

  const opciones = (grupo) => {
    const lista = referencias.lista(RECURSO_DE[grupo])
    return grupo === 'talla' ? [...lista].sort((a, b) => compararTallas(a.nombre, b.nombre)) : lista
  }

  const estaActivo = (grupo, id) => filtros[grupo].includes(id)

  const aplicar = (cambios) => {
    const f = { ...filtros, ...cambios }
    const lista = (ids) => (ids.length ? ids.join(',') : null)
    setSidebarMovil(false)
    navigate(
      conQuery(location.pathname, {
        q: f.q.trim() || null,
        categoria: lista(f.categoria),
        coleccion: lista(f.coleccion),
        color: lista(f.color),
        talla: lista(f.talla),
        temporada: lista(f.temporada),
        disponibles: f.disponibles ? 1 : null,
        orden: f.orden === 'relevancia' ? null : f.orden,
        pagina: f.pagina > 1 ? f.pagina : null,
      }),
      { replace: true },
    )
  }

  const alternar = (grupo, id) => {
    const actual = filtros[grupo]
    const nuevo = actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]
    aplicar({ [grupo]: nuevo, pagina: 1 })
  }

  const alternarGrupo = (grupo) => {
    setAbiertos((s) => {
      const copia = new Set(s)
      if (copia.has(grupo)) copia.delete(grupo)
      else copia.add(grupo)
      return copia
    })
  }

  const buscar = (texto) => aplicar({ q: texto, pagina: 1 })
  const alternarDisponibles = () => aplicar({ disponibles: !filtros.disponibles, pagina: 1 })
  const cambiarOrden = (orden) => aplicar({ orden, pagina: 1 })

  const irAPagina = (p) => {
    if (p < 1 || p > totalPaginas) return
    aplicar({ pagina: p })
  }

  const quitarChip = (chip) => {
    if (chip.grupo === 'q') return aplicar({ q: '', pagina: 1 })
    if (chip.grupo === 'disponibles') return aplicar({ disponibles: false, pagina: 1 })
    alternar(chip.grupo, chip.id)
  }

  const limpiar = () => {
    setSidebarMovil(false)
    navigate(location.pathname, { replace: true })
  }

  const reintentar = () => {
    setCargando(true)
    setError(null)
    catalogoService
      .refrescar()
      .then(() => setCargando(false))
      .catch((e) => {
        setError(e.message)
        setCargando(false)
      })
  }

  const renderOpciones = (grupo) => {
    if (grupo === 'color') {
      const lista = opciones('color')
      return (
        <div className="flex flex-wrap gap-2">
          {lista.length > 0 ? (
            lista.map((op) => {
              const color = colorDesdeNombre(op.nombre)
              return (
                <button
                  key={op.id}
                  type="button"
                  className={cx(
                    'flex h-8 w-8 items-center justify-center rounded-full transition-all',
                    estaActivo('color', op.id) ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110',
                  )}
                  title={op.nombre}
                  onClick={() => alternar('color', op.id)}
                >
                  <span
                    className={cx(
                      'block h-7 w-7 rounded-full',
                      esColorClaro(color) ? 'border border-outline' : 'border border-outline-variant',
                    )}
                    style={{ backgroundColor: color }}
                  ></span>
                </button>
              )
            })
          ) : (
            <p className="text-xs text-on-surface-variant">Sin colores cargados</p>
          )}
        </div>
      )
    }

    if (grupo === 'talla') {
      const lista = opciones('talla')
      return (
        <div className="flex flex-wrap gap-2">
          {lista.length > 0 ? (
            lista.map((op) => (
              <button
                key={op.id}
                type="button"
                className={cx(
                  'min-w-10 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  estaActivo('talla', op.id)
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary',
                )}
                onClick={() => alternar('talla', op.id)}
              >
                {op.nombre}
              </button>
            ))
          ) : (
            <p className="text-xs text-on-surface-variant">Sin tallas cargadas</p>
          )}
        </div>
      )
    }

    const lista = opciones(grupo)
    return (
      <ul className="space-y-1.5">
        {lista.length > 0 ? (
          lista.map((op) => (
            <li key={op.id}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-on-surface">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-outline accent-primary"
                  checked={estaActivo(grupo, op.id)}
                  onChange={() => alternar(grupo, op.id)}
                />
                {op.nombre}
              </label>
            </li>
          ))
        ) : (
          <li className="text-xs text-on-surface-variant">Sin opciones</li>
        )}
      </ul>
    )
  }

  let resultadosVista
  if (cargando) {
    resultadosVista = <Skeleton tipo="tarjetas" cantidad={8} />
  } else if (error) {
    resultadosVista = (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-[32px] text-error">cloud_off</span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface">No pudimos cargar el catálogo</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{error}</p>
        <button type="button" className="btn-secundario mt-6" onClick={reintentar}>
          <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
        </button>
      </div>
    )
  } else {
    resultadosVista = (
      <>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-on-surface-variant">
            <span className="font-semibold text-on-surface">{resultados.length}</span>{' '}
            {resultados.length === 1 ? 'producto' : 'productos'}
          </p>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                key={`${chip.grupo}${chip.id}`}
                type="button"
                className="chip gap-1.5 bg-surface-container text-primary hover:bg-primary hover:text-on-primary"
                onClick={() => quitarChip(chip)}
              >
                {chip.texto}
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            ))}
            {hayFiltros && (
              <button
                type="button"
                className="text-xs font-semibold text-on-surface-variant hover:text-primary hover:underline"
                onClick={limpiar}
              >
                Limpiar todo
              </button>
            )}
          </div>
          <div className="relative">
            <select
              className="campo w-52 appearance-none py-2 pr-9 text-xs"
              value={filtros.orden}
              onChange={(e) => cambiarOrden(e.target.value)}
              aria-label="Ordenar"
            >
              <option value="relevancia">Orden: relevancia</option>
              <option value="nuevos">Orden: nuevos ingresos</option>
              <option value="precio_asc">Orden: menor precio</option>
              <option value="precio_desc">Orden: mayor precio</option>
              <option value="nombre">Orden: nombre A-Z</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
              expand_more
            </span>
          </div>
        </div>

        {resultados.length === 0 ? (
          <div className="tarjeta p-0">
            <EstadoVacio
              icono="search_off"
              titulo="No encontramos productos"
              descripcion={
                hayFiltros
                  ? 'Prueba quitando algún filtro o buscando con otra palabra.'
                  : 'Todavía no hay prendas cargadas en el catálogo.'
              }
              textoAccion={hayFiltros ? 'Limpiar filtros' : null}
              onAccion={limpiar}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {paginaActual.map((grupo) => (
                <TarjetaProducto key={grupo.clave} grupo={grupo} />
              ))}
            </div>

            {totalPaginas > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Paginación">
                <button
                  type="button"
                  className="btn-secundario px-3 py-2"
                  disabled={pagina === 1}
                  onClick={() => irAPagina(pagina - 1)}
                  aria-label="Anterior"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                {paginas.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={cx(
                      'h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition-colors',
                      p === pagina ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low',
                    )}
                    onClick={() => irAPagina(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn-secundario px-3 py-2"
                  disabled={pagina === totalPaginas}
                  onClick={() => irAPagina(pagina + 1)}
                  aria-label="Siguiente"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </nav>
            )}
          </>
        )}
      </>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-on-surface">Catálogo</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Precios y disponibilidad de{' '}
            <span className="font-semibold text-on-surface">{sucursal?.nombre ?? 'la sucursal elegida'}</span>. Cámbiala
            desde el selector de arriba.
          </p>
        </div>
        <button type="button" className="btn-secundario lg:hidden" onClick={() => setSidebarMovil(true)}>
          <span className="material-symbols-outlined text-[18px]">tune</span>
          Filtros
          {hayFiltros && (
            <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-on-primary">{chips.length}</span>
          )}
        </button>
      </div>

      <div className="flex gap-8">
        {sidebarMovil && (
          <div
            className="fixed inset-0 z-40 bg-on-surface/50 lg:hidden"
            onClick={() => setSidebarMovil(false)}
            aria-hidden="true"
          ></div>
        )}
        <aside
          className={cx(
            'fixed inset-y-0 left-0 z-50 w-[300px] overflow-y-auto bg-surface-container-lowest p-5 shadow-xl transition-transform lg:static lg:z-auto lg:w-[280px] lg:shrink-0 lg:translate-x-0 lg:overflow-visible lg:bg-transparent lg:p-0 lg:shadow-none',
            sidebarMovil ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <h2 className="text-lg font-semibold">Filtros</h2>
            <button type="button" className="btn-icono" onClick={() => setSidebarMovil(false)} aria-label="Cerrar">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-5 lg:sticky lg:top-24">
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3">
              <span className="text-sm">
                <span className="block font-semibold text-on-surface">Solo disponibles en mi sucursal</span>
                <span className="block text-xs text-on-surface-variant">{sucursal?.nombre ?? 'Elige una sucursal'}</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={filtros.disponibles}
                className={cx(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  filtros.disponibles ? 'bg-primary' : 'bg-outline',
                )}
                onClick={alternarDisponibles}
              >
                <span
                  className={cx(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-transform',
                    filtros.disponibles ? 'translate-x-5.5' : 'translate-x-0.5',
                  )}
                ></span>
              </button>
            </label>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                key={filtros.q}
                type="search"
                placeholder="Buscar por nombre..."
                className="campo pl-9"
                defaultValue={filtros.q}
                onBlur={(e) => e.target.value !== filtros.q && buscar(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') buscar(e.currentTarget.value)
                }}
              />
            </div>

            {GRUPOS.map((grupo) => (
              <div key={grupo} className="border-t border-outline-variant pt-4">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-sm font-semibold text-on-surface"
                  onClick={() => alternarGrupo(grupo)}
                >
                  {ETIQUETA_DE[grupo]}
                  <span
                    className={cx(
                      'material-symbols-outlined text-[20px] text-on-surface-variant transition-transform',
                      abiertos.has(grupo) && 'rotate-180',
                    )}
                  >
                    expand_more
                  </span>
                </button>

                {abiertos.has(grupo) && <div className="mt-3">{renderOpciones(grupo)}</div>}
              </div>
            ))}

            <button type="button" className="btn-secundario w-full" disabled={!hayFiltros} onClick={limpiar}>
              Limpiar filtros
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">{resultadosVista}</section>
      </div>
    </>
  )
}
