import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { sucursalesService } from '../services/sucursales.service'
import { ciudadesService } from '@/features/ciudades/services/ciudades.service'
import { toast } from '@/core/stores/toast.store'
import Skeleton from '@/shared/components/Skeleton'
import CampoImagen from '@/shared/components/CampoImagen'
import { errorDe, maximo, numeroONulo, requerido } from '@/shared/utils/formularios'
import { cx } from '@/shared/utils/clases'

const VACIO = { nombre: '', ubicacion: '', ciudad_id: null }

export default function SucursalForm() {
  const { id } = useParams()
  return <Formulario key={id ?? 'nueva'} id={id} />
}

function Formulario({ id }) {
  const navigate = useNavigate()
  const esEdicion = id !== undefined

  const [cargando, setCargando] = useState(esEdicion)
  const [errorCarga, setErrorCarga] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)

  const [ciudades, setCiudades] = useState([])
  const [sucursal, setSucursal] = useState(null)

  const [archivoNuevo, setArchivoNuevo] = useState(null)
  const [quitarFoto, setQuitarFoto] = useState(false)
  const fotoActual = sucursal ? sucursalesService.urlFoto(sucursal) : null

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onTouched', defaultValues: VACIO })

  useEffect(() => {
    ciudadesService
      .listar()
      .then(setCiudades)
      .catch(() => toast.error('No pudimos cargar las ciudades'))
  }, [])

  useEffect(() => {
    if (id === undefined) return
    sucursalesService
      .obtener(Number(id))
      .then((s) => {
        setSucursal(s)
        reset({ nombre: s.nombre, ubicacion: s.ubicacion, ciudad_id: s.ciudad_id })
        setCargando(false)
      })
      .catch((e) => {
        setErrorCarga(e.status === 404 ? 'La sucursal no existe o fue eliminada.' : e.message)
        setCargando(false)
      })
  }, [id, reset])

  const alElegirArchivo = (archivo) => {
    setArchivoNuevo(archivo)
    if (archivo) setQuitarFoto(false)
  }

  const alQuitarFotoActual = () => {
    setArchivoNuevo(null)
    setQuitarFoto(true)
  }

  const sincronizarFoto = (guardada) => {
    let cambio = null
    if (archivoNuevo) {
      cambio = sucursalesService.subirFoto(guardada.id, archivoNuevo)
    } else if (quitarFoto && guardada.foto) {
      cambio = sucursalesService.quitarFoto(guardada.id)
    }
    if (!cambio) return Promise.resolve(guardada)

    return cambio.catch((e) => {
      const motivo = e.status === 413 ? 'supera los 5 MB' : e.message
      toast.advertencia(`Los datos se guardaron, pero la foto no: ${motivo}`)
      return guardada
    })
  }

  const guardar = (valores) => {
    setGuardando(true)
    setErrorGeneral(null)

    const datos = {
      nombre: valores.nombre.trim(),
      ubicacion: valores.ubicacion.trim(),
      ciudad_id: valores.ciudad_id,
    }

    const peticion = sucursal ? sucursalesService.actualizar(sucursal.id, datos) : sucursalesService.crear(datos)

    peticion
      .then(sincronizarFoto)
      .then(() => {
        toast.exito(sucursal ? 'Sucursal actualizada' : 'Sucursal creada')
        navigate('/panel/sucursales')
      })
      .catch((e) => {
        setGuardando(false)
        setErrorGeneral(e.message)
      })
  }

  let contenido
  if (cargando) {
    contenido = <Skeleton tipo="bloque" />
  } else if (errorCarga) {
    contenido = (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-[32px] text-error">error</span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface">No pudimos abrir la sucursal</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{errorCarga}</p>
        <Link to="/panel/sucursales" className="btn-secundario mt-6">
          Volver a la lista
        </Link>
      </div>
    )
  } else {
    contenido = (
      <form onSubmit={handleSubmit(guardar)} noValidate>
        {errorGeneral && (
          <div className="mb-5 rounded-lg border-l-4 border-error bg-error/5 p-4 text-sm text-on-surface" role="alert">
            <span className="font-semibold text-error">No se pudo guardar.</span> {errorGeneral}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="tarjeta space-y-5 lg:col-span-7">
            <h2 className="flex items-center gap-2 text-base font-semibold text-on-surface">
              <span className="material-symbols-outlined text-primary">storefront</span>
              Datos de la sucursal
            </h2>

            <div>
              <label className="etiqueta" htmlFor="nombre">
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                placeholder="Ej. Sucursal Norte"
                className={cx('campo', errors.nombre && 'campo-invalido')}
                {...register('nombre', { required: requerido, maxLength: maximo(100) })}
              />
              {errors.nombre && <p className="mensaje-campo">{errorDe(errors.nombre)}</p>}
            </div>

            <div>
              <label className="etiqueta" htmlFor="ubicacion">
                Dirección
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                  location_on
                </span>
                <input
                  id="ubicacion"
                  type="text"
                  placeholder="Ej. Av. Banzer 3er anillo"
                  className={cx('campo pl-10', errors.ubicacion && 'campo-invalido')}
                  {...register('ubicacion', { required: requerido, maxLength: maximo(200) })}
                />
              </div>
              {errors.ubicacion && <p className="mensaje-campo">{errorDe(errors.ubicacion)}</p>}
            </div>

            <div>
              <label className="etiqueta" htmlFor="ciudad">
                Ciudad
              </label>
              <div className="relative">
                <Controller
                  name="ciudad_id"
                  control={control}
                  rules={{ required: requerido }}
                  render={({ field }) => (
                    <select
                      id="ciudad"
                      ref={field.ref}
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(numeroONulo(e.target.value))}
                      onBlur={field.onBlur}
                      className={cx('campo appearance-none pr-10', errors.ciudad_id && 'campo-invalido')}
                    >
                      <option value="" disabled>
                        Selecciona una ciudad
                      </option>
                      {ciudades.map((ciudad) => (
                        <option key={ciudad.id} value={ciudad.id}>
                          {ciudad.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  expand_more
                </span>
              </div>
              {errors.ciudad_id && <p className="mensaje-campo">{errorDe(errors.ciudad_id)}</p>}
              {ciudades.length === 0 && (
                <p className="mt-1 text-xs text-on-surface-variant">
                  No hay ciudades cargadas.{' '}
                  <Link to="/panel/ciudades" className="font-semibold text-primary hover:underline">
                    Crea una primero
                  </Link>
                  .
                </p>
              )}
            </div>
          </section>

          <section className="tarjeta lg:col-span-5">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-on-surface">
              <span className="material-symbols-outlined text-primary">photo_camera</span>
              Foto de la fachada
            </h2>
            <CampoImagen
              urlActual={fotoActual}
              deshabilitado={guardando}
              onArchivo={alElegirArchivo}
              onQuitarActual={alQuitarFotoActual}
            />
            <p className="mt-3 text-xs text-on-surface-variant">
              Se muestra en las tarjetas de sucursal de la tienda y del panel. Es opcional.
            </p>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-outline-variant pt-5">
          <Link to="/panel/sucursales" className="btn-secundario">
            Cancelar
          </Link>
          <button type="submit" className="btn-primario" disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear sucursal'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-6">
        <Link
          to="/panel/sucursales"
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Volver a sucursales
        </Link>
        <h1 className="text-2xl font-semibold text-on-surface">{esEdicion ? 'Editar sucursal' : 'Nueva sucursal'}</h1>
      </div>

      {contenido}
    </div>
  )
}
