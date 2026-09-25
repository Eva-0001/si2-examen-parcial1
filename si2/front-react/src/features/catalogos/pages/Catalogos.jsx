import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { catalogosService } from '../services/catalogos.service'
import { PESTANAS_CATALOGO, compararTallas } from '../catalogos.config'
import ModalCatalogo from '../components/ModalCatalogo'
import { useReferenciasStore } from '@/core/stores/referencias.store'
import { toast } from '@/core/stores/toast.store'
import Tabla from '@/shared/components/Tabla'
import EstadoVacio from '@/shared/components/EstadoVacio'
import ModalConfirmacion from '@/shared/components/ModalConfirmacion'
import { colorDesdeNombre, esColorClaro } from '@/shared/utils/colores'
import { cx } from '@/shared/utils/clases'

const ESTADO_INICIAL = { items: [], cargando: true, error: null }

const ordenar = (items) => [...items].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

const invalidarCache = () => useReferenciasStore.getState().invalidar()

export default function Catalogos() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [activa, setActiva] = useState(
    () => PESTANAS_CATALOGO.find((p) => p.recurso === searchParams.get('pestana')) ?? PESTANAS_CATALOGO[0],
  )
  const [estados, setEstados] = useState({})
  const estado = estados[activa.recurso] ?? ESTADO_INICIAL
  const [busqueda, setBusqueda] = useState('')

  const [enEdicion, setEnEdicion] = useState(undefined)
  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState(null)

  const actualizarEstado = useCallback((recurso, nuevo) => {
    setEstados((todos) => ({ ...todos, [recurso]: nuevo }))
  }, [])

  const pedir = useCallback(
    (recurso) => {
      catalogosService
        .listar(recurso)
        .then((items) => actualizarEstado(recurso, { items: ordenar(items), cargando: false, error: null }))
        .catch((e) => actualizarEstado(recurso, { items: [], cargando: false, error: e.message }))
    },
    [actualizarEstado],
  )

  const cargar = (recurso = activa.recurso) => {
    actualizarEstado(recurso, { items: [], cargando: true, error: null })
    pedir(recurso)
  }

  const [recursoInicial] = useState(activa.recurso)
  useEffect(() => {
    pedir(recursoInicial)
  }, [pedir, recursoInicial])

  const texto = busqueda.trim().toLowerCase()
  const filtrada = texto
    ? estado.items.filter(
        (i) => i.nombre.toLowerCase().includes(texto) || (i.descripcion ?? '').toLowerCase().includes(texto),
      )
    : estado.items
  const items = activa.vista === 'chips' ? [...filtrada].sort((a, b) => compararTallas(a.nombre, b.nombre)) : filtrada

  const nombres = estado.items.map((i) => i.nombre)

  const elegir = (pestana) => {
    if (pestana.recurso === activa.recurso) return
    setActiva(pestana)
    setBusqueda('')
    setSearchParams({ pestana: pestana.recurso }, { replace: true })
    if (!estados[pestana.recurso]) cargar(pestana.recurso)
  }

  const textoNuevo = `${activa.femenino ? 'Nueva' : 'Nuevo'} ${activa.singular}`

  const abrirNuevo = () => setEnEdicion(null)
  const abrirEditar = (item) => setEnEdicion(item)
  const cerrarModal = () => setEnEdicion(undefined)

  const alGuardar = (item) => {
    const recurso = activa.recurso
    setEstados((todos) => {
      const actual = todos[recurso] ?? ESTADO_INICIAL
      const existe = actual.items.some((i) => i.id === item.id)
      const lista = existe ? actual.items.map((i) => (i.id === item.id ? item : i)) : [...actual.items, item]
      return { ...todos, [recurso]: { ...actual, items: ordenar(lista) } }
    })
    invalidarCache()
    cerrarModal()
  }

  const pedirEliminar = (item) => {
    setErrorEliminar(null)
    setAEliminar(item)
  }

  const eliminar = () => {
    const item = aEliminar
    if (!item) return

    const p = activa
    setEliminando(true)
    catalogosService
      .eliminar(p.recurso, item.id)
      .then(() => {
        setEstados((todos) => {
          const actual = todos[p.recurso] ?? ESTADO_INICIAL
          return { ...todos, [p.recurso]: { ...actual, items: actual.items.filter((i) => i.id !== item.id) } }
        })
        invalidarCache()
        setEliminando(false)
        setAEliminar(null)
        const singular = p.singular.charAt(0).toUpperCase() + p.singular.slice(1)
        toast.exito(`${singular} eliminad${p.femenino ? 'a' : 'o'}`)
      })
      .catch((e) => {
        setEliminando(false)
        setErrorEliminar(e.message)
      })
  }

  let contenidoChips = null
  if (activa.vista === 'chips') {
    if (estado.cargando) {
      contenidoChips = (
        <div className="flex animate-pulse flex-wrap gap-3 p-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-10 w-20 rounded-full bg-surface-container-low"></div>
          ))}
        </div>
      )
    } else if (estado.error) {
      contenidoChips = (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <span className="material-symbols-outlined text-[32px] text-error">cloud_off</span>
          </div>
          <h3 className="text-lg font-semibold text-on-surface">No pudimos cargar las tallas</h3>
          <p className="mt-1 text-sm text-on-surface-variant">{estado.error}</p>
          <button type="button" className="btn-secundario mt-6" onClick={() => cargar()}>
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Reintentar
          </button>
        </div>
      )
    } else if (items.length === 0) {
      contenidoChips = (
        <EstadoVacio
          icono="straighten"
          titulo={busqueda ? 'Sin resultados' : 'No hay tallas todavía'}
          descripcion={
            busqueda ? 'Ninguna talla coincide con la búsqueda.' : 'Carga las tallas que usa la tienda: XS, S, M, L, XL.'
          }
          textoAccion={busqueda ? null : 'Nueva talla'}
          onAccion={abrirNuevo}
        />
      )
    } else {
      contenidoChips = (
        <>
          <div className="flex flex-wrap gap-3 p-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-lowest py-1.5 pl-4 pr-1.5 shadow-card transition-colors hover:border-primary"
              >
                <span className="text-sm font-semibold text-on-surface">{item.nombre}</span>
                <button type="button" className="btn-icono ml-1 p-1" title="Editar" onClick={() => abrirEditar(item)}>
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button type="button" className="btn-icono-peligro p-1" title="Eliminar" onClick={() => pedirEliminar(item)}>
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            ))}
          </div>
          <p className="border-t border-outline-variant px-6 py-3 text-xs text-on-surface-variant">
            {items.length} {items.length === 1 ? 'talla' : 'tallas'}
          </p>
        </>
      )
    }
  }

  return (
    <>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-on-surface">Catálogos maestros</h1>
        </div>

        <nav className="mb-6 flex gap-6 overflow-x-auto border-b border-outline-variant" role="tablist">
          {PESTANAS_CATALOGO.map((pestana) => (
            <button
              key={pestana.recurso}
              type="button"
              role="tab"
              className={cx(
                '-mb-px flex shrink-0 items-center gap-1.5 border-b-2 pb-3 text-sm font-semibold transition-colors',
                activa.recurso === pestana.recurso
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface',
              )}
              aria-selected={activa.recurso === pestana.recurso}
              onClick={() => elegir(pestana)}
            >
              <span className="material-symbols-outlined text-[18px]">{pestana.icono}</span>
              {pestana.etiqueta}
            </button>
          ))}
        </nav>

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-on-surface-variant">{activa.descripcionPestana}</p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                placeholder={'Buscar en ' + activa.etiqueta.toLowerCase() + '...'}
                className="campo w-56 pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button type="button" className="btn-primario" onClick={abrirNuevo}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              {textoNuevo}
            </button>
          </div>
        </div>

        {activa.vista === 'chips' ? (
          <div className="tarjeta p-0">{contenidoChips}</div>
        ) : (
          <Tabla
            cargando={estado.cargando}
            error={estado.error}
            vacio={items.length === 0}
            iconoVacio={activa.icono}
            tituloVacio={busqueda ? 'Sin resultados' : 'No hay ' + activa.etiqueta.toLowerCase() + ' todavía'}
            descripcionVacio={busqueda ? 'Nada coincide con la búsqueda.' : activa.descripcionPestana}
            textoAccionVacio={busqueda ? null : textoNuevo}
            onAccionVacia={abrirNuevo}
            onReintentar={() => cargar()}
            pie={
              <p>
                {items.length} {items.length === 1 ? 'registro' : 'registros'}
                {busqueda ? ` de ${estado.items.length}` : null}
              </p>
            }
          >
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  {activa.conDescripcion && <th>Descripción</th>}
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const color = activa.vista === 'colores' ? colorDesdeNombre(item.nombre) : null
                  return (
                    <tr key={item.id}>
                      <td className="font-medium">
                        <div className="flex items-center gap-3">
                          {color && (
                            <span
                              className={cx(
                                'inline-block h-6 w-6 shrink-0 rounded-full shadow-card',
                                esColorClaro(color) ? 'border border-outline' : 'border border-outline-variant',
                              )}
                              style={{ backgroundColor: color }}
                              aria-hidden="true"
                            ></span>
                          )}
                          {item.nombre}
                        </div>
                      </td>
                      {activa.conDescripcion && (
                        <td className="max-w-md truncate text-on-surface-variant">{item.descripcion || '—'}</td>
                      )}
                      <td>
                        <div className="acciones-fila">
                          <button type="button" className="btn-icono" title="Editar" onClick={() => abrirEditar(item)}>
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            type="button"
                            className="btn-icono-peligro"
                            title="Eliminar"
                            onClick={() => pedirEliminar(item)}
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

      {enEdicion !== undefined && (
        <ModalCatalogo
          pestana={activa}
          item={enEdicion ?? null}
          nombresOcupados={nombres}
          onCerrar={cerrarModal}
          onGuardado={alGuardar}
        />
      )}

      {aEliminar && (
        <ModalConfirmacion
          titulo={'¿Eliminar ' + aEliminar.nombre + '?'}
          mensaje="Esta acción no se puede deshacer. Si ya tiene productos asociados, no se podrá eliminar."
          error={errorEliminar}
          cargando={eliminando}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </>
  )
}
