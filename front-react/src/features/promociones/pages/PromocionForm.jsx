import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { promocionesService } from '../services/promociones.service'
import { sucursalesService } from '@/features/sucursales/services/sucursales.service'
import { toast } from '@/core/stores/toast.store'
import Skeleton from '@/shared/components/Skeleton'
import CampoImagen from '@/shared/components/CampoImagen'
import VigenciaPromocion from '@/shared/components/VigenciaPromocion'
import { errorDe, maximo, numeroONulo, requerido } from '@/shared/utils/formularios'
import { hoyISO } from '@/shared/utils/fechas'
import { cx } from '@/shared/utils/clases'

const valoresDe = (p) => ({
  nombre: p?.nombre ?? '',
  descripcion: p?.descripcion ?? '',
  fecha_inicio: p?.fecha_inicio ?? hoyISO(),
  fecha_final: p?.fecha_final ?? '',
  sucursal_id: p?.sucursal_id ?? null,
})

export default function PromocionForm() {
  const { id } = useParams()
  return <Formulario key={id ?? 'nueva'} id={id} />
}

function Formulario({ id }) {
  const navigate = useNavigate()
  const esEdicion = id !== undefined

  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)

  const [sucursales, setSucursales] = useState([])
  const [promocion, setPromocion] = useState(null)
  const [archivoNuevo, setArchivoNuevo] = useState(null)
  const [quitarFoto, setQuitarFoto] = useState(false)
  const fotoActual = promocion ? promocionesService.urlFoto(promocion) : null

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, touchedFields, isSubmitted },
  } = useForm({ mode: 'onTouched', defaultValues: valoresDe(null) })

  const inicio = useWatch({ control, name: 'fecha_inicio' }) ?? ''
  const fin = useWatch({ control, name: 'fecha_final' }) ?? ''
  const rango = Boolean(inicio && fin && fin < inicio)
  const mostrarRango = rango && (touchedFields.fecha_final || isSubmitted)

  useEffect(() => {
    Promise.all([sucursalesService.listar(), id === undefined ? Promise.resolve(null) : promocionesService.obtener(Number(id))])
      .then(([listaSucursales, p]) => {
        setSucursales(listaSucursales)
        setPromocion(p)
        reset(valoresDe(p))
        setCargando(false)
      })
      .catch((e) => {
        setErrorCarga(e.status === 404 ? 'La promoción no existe o fue eliminada.' : e.message)
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
    if (archivoNuevo) cambio = promocionesService.subirFoto(guardada.id, archivoNuevo)
    else if (quitarFoto && guardada.foto) cambio = promocionesService.quitarFoto(guardada.id)
    if (!cambio) return Promise.resolve(guardada)

    return cambio.catch((e) => {
      const motivo = e.status === 413 ? 'supera los 5 MB' : e.message
      toast.advertencia(`Los datos se guardaron, pero la foto no: ${motivo}`)
      return guardada
    })
  }

  const guardar = (v) => {
    if (rango) return

    setGuardando(true)
    setErrorGeneral(null)

    const datos = {
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim() || null,
      fecha_inicio: v.fecha_inicio,
      fecha_final: v.fecha_final,
      sucursal_id: v.sucursal_id,
    }

    const peticion = promocion ? promocionesService.actualizar(promocion.id, datos) : promocionesService.crear(datos)

    peticion
      .then(sincronizarFoto)
      .then(() => {
        toast.exito(promocion ? 'Promoción actualizada' : 'Promoción creada')
        navigate('/panel/promociones')
      })
      .catch((e) => {
        setGuardando(false)
        setErrorGeneral(
          e.status === 422 && /fecha/i.test(e.message) ? 'La fecha final no puede ser anterior a la de inicio.' : e.message,
        )
      })
  }

  let contenido
  if (cargando) {
    contenido = (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Skeleton tipo="bloque" />
        </div>
        <div className="lg:col-span-5">
          <Skeleton tipo="bloque" />
        </div>
      </div>
    )
  } else if (errorCarga) {
    contenido = (
      <div className="tarjeta flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-[32px] text-error">error</span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface">No pudimos abrir la promoción</h3>
        <p className="mt-1 text-sm text-on-surface-variant">{errorCarga}</p>
        <Link to="/panel/promociones" className="btn-secundario mt-6">
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
              <span className="material-symbols-outlined text-primary">sell</span>
              Datos de la promoción
            </h2>

            <div>
              <label className="etiqueta" htmlFor="pm-nombre">
                Nombre
              </label>
              <input
                id="pm-nombre"
                type="text"
                placeholder="Ej. 2x1 en poleras"
                className={cx('campo', errors.nombre && 'campo-invalido')}
                {...register('nombre', { required: requerido, maxLength: maximo(100) })}
              />
              {errors.nombre ? (
                <p className="mensaje-campo">{errorDe(errors.nombre)}</p>
              ) : (
                <p className="mt-1 text-xs text-on-surface-variant">
                  Si incluye "2x1" o "40%", la tienda lo muestra como etiqueta destacada.
                </p>
              )}
            </div>

            <div>
              <label className="etiqueta" htmlFor="pm-descripcion">
                Descripción <span className="font-normal normal-case">(opcional)</span>
              </label>
              <textarea
                id="pm-descripcion"
                rows={3}
                placeholder="Condiciones o detalle del beneficio"
                className={cx('campo resize-none', errors.descripcion && 'campo-invalido')}
                {...register('descripcion', { maxLength: maximo(300) })}
              ></textarea>
              {errors.descripcion && <p className="mensaje-campo">{errorDe(errors.descripcion)}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="etiqueta" htmlFor="pm-inicio">
                  Fecha de inicio
                </label>
                <input
                  id="pm-inicio"
                  type="date"
                  className={cx('campo', errors.fecha_inicio && 'campo-invalido')}
                  {...register('fecha_inicio', { required: requerido })}
                />
                {errors.fecha_inicio && <p className="mensaje-campo">{errorDe(errors.fecha_inicio)}</p>}
              </div>
              <div>
                <label className="etiqueta" htmlFor="pm-final">
                  Fecha final
                </label>
                <input
                  id="pm-final"
                  type="date"
                  min={inicio}
                  className={cx('campo', (errors.fecha_final || mostrarRango) && 'campo-invalido')}
                  {...register('fecha_final', { required: requerido })}
                />
                {mostrarRango ? (
                  <p className="mensaje-campo">La fecha final no puede ser anterior a la de inicio</p>
                ) : (
                  errors.fecha_final && <p className="mensaje-campo">{errorDe(errors.fecha_final)}</p>
                )}
              </div>
            </div>

            {inicio && fin && !rango && (
              <div className="rounded-lg bg-surface-container-low p-3">
                <p className="mb-2 text-xs font-semibold text-on-surface-variant">Así se verá la vigencia hoy</p>
                <VigenciaPromocion fechaInicio={inicio} fechaFinal={fin} />
              </div>
            )}

            <div>
              <label className="etiqueta" htmlFor="pm-sucursal">
                Sucursal donde aplica
              </label>
              <div className="relative">
                <select
                  id="pm-sucursal"
                  className={cx('campo appearance-none pr-9', errors.sucursal_id && 'campo-invalido')}
                  {...register('sucursal_id', { required: requerido, setValueAs: numeroONulo })}
                >
                  <option value="" disabled>
                    Selecciona una sucursal
                  </option>
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
              {errors.sucursal_id && <p className="mensaje-campo">{errorDe(errors.sucursal_id)}</p>}
            </div>
          </section>

          <section className="tarjeta lg:col-span-5">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-on-surface">
              <span className="material-symbols-outlined text-primary">image</span>
              Imagen de la promoción
            </h2>
            <CampoImagen
              urlActual={fotoActual}
              deshabilitado={guardando}
              onArchivo={alElegirArchivo}
              onQuitarActual={alQuitarFotoActual}
            />
            <p className="mt-3 text-xs text-on-surface-variant">
              Aparece en el inicio y en la página de promociones. Ideal apaisada.
            </p>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-outline-variant pt-5">
          <Link to="/panel/promociones" className="btn-secundario">
            Cancelar
          </Link>
          <button type="submit" className="btn-primario" disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear promoción'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-6">
        <Link
          to="/panel/promociones"
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Volver a promociones
        </Link>
        <h1 className="text-2xl font-semibold text-on-surface">{esEdicion ? 'Editar promoción' : 'Nueva promoción'}</h1>
      </div>

      {contenido}
    </div>
  )
}
