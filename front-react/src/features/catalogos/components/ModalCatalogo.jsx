import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { catalogosService } from '../services/catalogos.service'
import { toast } from '@/core/stores/toast.store'
import Modal from '@/shared/components/Modal'
import { errorDe, marcarErrorApi, maximo, nombreUnico, requerido } from '@/shared/utils/formularios'
import { cx } from '@/shared/utils/clases'

export default function ModalCatalogo({ pestana, item = null, nombresOcupados = [], onCerrar, onGuardado }) {
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)

  const titulo = `${item ? 'Editar' : pestana.femenino ? 'Nueva' : 'Nuevo'} ${pestana.singular}`

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: { nombre: item?.nombre ?? '', descripcion: item?.descripcion ?? '' },
  })

  const guardar = (valores) => {
    setGuardando(true)
    setErrorGeneral(null)

    const datos = { nombre: valores.nombre.trim() }
    if (pestana.conDescripcion) datos.descripcion = valores.descripcion.trim() || null

    const peticion = item
      ? catalogosService.actualizar(pestana.recurso, item.id, datos)
      : catalogosService.crear(pestana.recurso, datos)

    peticion
      .then((guardado) => {
        const singular = pestana.singular.charAt(0).toUpperCase() + pestana.singular.slice(1)
        toast.exito(`${singular} ${item ? 'actualizad' : 'cread'}${pestana.femenino ? 'a' : 'o'}`)
        onGuardado(guardado)
      })
      .catch((e) => {
        setGuardando(false)
        if (e.status === 409 || (e.status === 500 && item)) {
          marcarErrorApi(
            setError,
            'nombre',
            `Ya existe ${pestana.femenino ? 'una' : 'un'} ${pestana.singular} con ese nombre`,
          )
        } else {
          setErrorGeneral(e.message)
        }
      })
  }

  return (
    <Modal
      titulo={titulo}
      onCerrar={onCerrar}
      footer={
        <>
          <button type="button" className="btn-secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" form="form-catalogo" className="btn-primario" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      {errorGeneral && (
        <div className="mb-5 rounded-lg border-l-4 border-error bg-error/5 p-3 text-sm text-on-surface" role="alert">
          {errorGeneral}
        </div>
      )}

      <form id="form-catalogo" onSubmit={handleSubmit(guardar)} className="space-y-5" noValidate>
        <div>
          <label className="etiqueta" htmlFor="catalogo-nombre">
            Nombre
          </label>
          <input
            id="catalogo-nombre"
            type="text"
            placeholder={pestana.placeholder}
            className={cx('campo', errors.nombre && 'campo-invalido')}
            autoFocus
            {...register('nombre', {
              required: requerido,
              maxLength: maximo(100),
              validate: nombreUnico(
                () => nombresOcupados,
                () => item?.nombre ?? null,
              ),
            })}
          />
          {errors.nombre && <p className="mensaje-campo">{errorDe(errors.nombre)}</p>}
        </div>

        {pestana.conDescripcion && (
          <div>
            <label className="etiqueta" htmlFor="catalogo-descripcion">
              Descripción <span className="font-normal normal-case">(opcional)</span>
            </label>
            <textarea
              id="catalogo-descripcion"
              rows={3}
              placeholder="Una línea que explique qué agrupa"
              className={cx('campo resize-none', errors.descripcion && 'campo-invalido')}
              {...register('descripcion', { maxLength: maximo(300) })}
            ></textarea>
            {errors.descripcion && <p className="mensaje-campo">{errorDe(errors.descripcion)}</p>}
          </div>
        )}
      </form>
    </Modal>
  )
}
