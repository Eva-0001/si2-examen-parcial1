import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { sucursalesService } from '../services/sucursales.service'
import { ciudadesService } from '@/features/ciudades/services/ciudades.service'
import { toast } from '@/core/stores/toast.store'
import Skeleton from '@/shared/components/Skeleton'
import EstadoVacio from '@/shared/components/EstadoVacio'
import ModalConfirmacion from '@/shared/components/ModalConfirmacion'
import { cx } from '@/shared/utils/clases'

const claseFiltro = (activo) =>
  cx(
    'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
    activo
      ? 'border-primary bg-primary text-on-primary'
      : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low',
  )

export default function SucursalesAdmin() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [sucursales, setSucursales] = useState([])
  const [ciudades, setCiudades] = useState([])

  const [busqueda, setBusqueda] = useState('')
  const [ciudadFiltro, setCiudadFiltro] = useState(null)

  const nombreCiudad = new Map(ciudades.map((c) => [c.id, c.nombre]))

  const texto = busqueda.trim().toLowerCase()
  const filtradas = sucursales.filter(
    (s) =>
      (ciudadFiltro === null || s.ciudad_id === ciudadFiltro) &&
      (!texto || s.nombre.toLowerCase().includes(texto) || s.ubicacion.toLowerCase().includes(texto)),
  )

  const hayFiltros = busqueda.trim() !== '' || ciudadFiltro !== null

  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState(null)

  const pedir = useCallback(() => {
    Promise.all([sucursalesService.listar(), ciudadesService.listar()])
      .then(([listaSucursales, listaCiudades]) => {
        setSucursales(listaSucursales)
        setCiudades(listaCiudades)
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

  const ciudadDe = (sucursal) => nombreCiudad.get(sucursal.ciudad_id) ?? 'Sin ciudad'

  const cantidadEn = (ciudadId) =>
    ciudadId === null ? sucursales.length : sucursales.filter((s) => s.ciudad_id === ciudadId).length

  const limpiarFiltros = () => {
    setBusqueda('')
    setCiudadFiltro(null)
  }

  const pedirEliminar = (sucursal) => {
    setErrorEliminar(null)
    setAEliminar(sucursal)
  }

  const eliminar = () => {
    const sucursal = aEliminar
    if (!sucursal) return

    setEliminando(true)
    sucursalesService
      .eliminar(sucursal.id)
      .then(() => {
        setSucursales((lista) => lista.filter((s) => s.id !== sucursal.id))
        setEliminando(false)
        setAEliminar(null)
        toast.exito('Sucursal eliminada')
      })
      .catch((e) => {
        setEliminando(false)
        setErrorEliminar(e.message)
      })
  }

  let contenido
  if (cargando) {
    contenido = <Skeleton tipo="tarjetas" cantidad={6} />
  } else if (error) {
    contenido = (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-[32px] text-error">cloud_off</span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface">No pudimos cargar las sucursales</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{error}</p>
        <button type="button" className="btn-secundario mt-6" onClick={cargar}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Reintentar
        </button>
      </div>
    )
  } else if (filtradas.length === 0) {
    contenido = (
      <div className="tarjeta p-0">
        {hayFiltros ? (
          <EstadoVacio
            icono="search_off"
            titulo="Sin resultados"
            descripcion="Ninguna sucursal coincide con los filtros."
            textoAccion="Limpiar filtros"
            onAccion={limpiarFiltros}
          />
        ) : ciudades.length === 0 ? (
          <>
            <EstadoVacio
              icono="location_city"
              titulo="Primero crea una ciudad"
              descripcion="Cada sucursal pertenece a una ciudad. Carga al menos una para poder registrar sucursales."
            />
            <div className="pb-10 text-center">
              <Link to="/panel/ciudades" className="btn-primario">
                Ir a ciudades
              </Link>
            </div>
          </>
        ) : (
          <>
            <EstadoVacio
              icono="storefront"
              titulo="No hay sucursales todavía"
              descripcion="Registra la primera tienda con su dirección, ciudad y una foto de la fachada."
            />
            <div className="pb-10 text-center">
              <Link to="/panel/sucursales/nueva" className="btn-primario">
                Nueva sucursal
              </Link>
            </div>
          </>
        )}
      </div>
    )
  } else {
    contenido = (
      <>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((sucursal) => {
            const foto = sucursalesService.urlFoto(sucursal)
            const rutaEditar = `/panel/sucursales/${sucursal.id}/editar`
            return (
              <article
                key={sucursal.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card transition-colors hover:border-primary"
              >
                <Link to={rutaEditar} className="relative block h-40 bg-surface-container">
                  {foto ? (
                    <img src={foto} alt={sucursal.nombre} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="material-symbols-outlined text-[48px] text-primary/40">storefront</span>
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-surface-container-lowest/90 px-2.5 py-0.5 text-[11px] font-semibold text-on-surface shadow-card backdrop-blur-sm">
                    {ciudadDe(sucursal)}
                  </span>
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-base font-semibold text-on-surface transition-colors group-hover:text-primary">
                    {sucursal.nombre}
                  </h3>
                  <p className="mt-1.5 flex items-start gap-1.5 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined mt-0.5 text-[16px] text-outline">location_on</span>
                    <span>{sucursal.ubicacion}</span>
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-outline-variant pt-3">
                    <Link
                      to={rutaEditar}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Editar
                    </Link>
                    <button
                      type="button"
                      className="btn-icono-peligro"
                      title="Eliminar"
                      onClick={() => pedirEliminar(sucursal)}
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-on-surface-variant">
          {filtradas.length} {filtradas.length === 1 ? 'sucursal' : 'sucursales'}
          {hayFiltros ? ` de ${sucursales.length}` : null}
        </p>
      </>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">Sucursales</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                placeholder="Buscar por nombre o dirección..."
                className="campo w-64 pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <Link to="/panel/sucursales/nueva" className="btn-primario">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nueva sucursal
            </Link>
          </div>
        </div>

        {!cargando && !error && ciudades.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button type="button" className={claseFiltro(ciudadFiltro === null)} onClick={() => setCiudadFiltro(null)}>
              Todas ({cantidadEn(null)})
            </button>
            {ciudades.map((ciudad) => (
              <button
                key={ciudad.id}
                type="button"
                className={claseFiltro(ciudadFiltro === ciudad.id)}
                onClick={() => setCiudadFiltro(ciudad.id)}
              >
                {ciudad.nombre} ({cantidadEn(ciudad.id)})
              </button>
            ))}
          </div>
        )}

        {contenido}
      </div>

      {aEliminar && (
        <ModalConfirmacion
          titulo={'¿Eliminar ' + aEliminar.nombre + '?'}
          mensaje="Esta acción no se puede deshacer. Si la sucursal ya tiene ventas o reservas, no se podrá eliminar."
          error={errorEliminar}
          cargando={eliminando}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}
    </>
  )
}
