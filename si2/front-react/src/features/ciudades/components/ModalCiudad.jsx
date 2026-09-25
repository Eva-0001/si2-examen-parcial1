import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ciudadesService } from '../services/ciudades.service'
import { toast } from '@/core/stores/toast.store'
import Modal from '@/shared/components/Modal'
import { errorDe, marcarErrorApi, maximo, nombreUnico, requerido } from '@/shared/utils/formularios'
import { cx } from '@/shared/utils/clases'

export default function ModalCiudad({ ciudad = null, nombresOcupados = [], onCerrar, onGuardado }) {
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ mode: 'onTouched', defaultValues: { nombre: ciudad?.nombre ?? '' } })

  const guardar = (valores) => {
    setGuardando(true)
    setErrorGeneral(null)

    const datos = { nombre: valores.nombre.trim() }
    const peticion = ciudad ? ciudadesService.actualizar(ciudad.id, datos) : ciudadesService.crear(datos)

    peticion
      .then((guardada) => {
        toast.exito(ciudad ? 'Ciudad actualizada' : 'Ciudad creada')
        onGuardado(guardada)
      })
      .catch((e) => {
        setGuardando(false)
        if (e.status === 409 || (e.status === 500 && ciudad)) {
          marcarErrorApi(setError, 'nombre', 'Ya existe una ciudad con ese nombre')
        } else {
          setErrorGeneral(e.message)
        }
      })
  }

  return (
    <Modal
      titulo={ciudad ? 'Editar ciudad' : 'Nueva ciudad'}
      onCerrar={onCerrar}
      footer={
        <>
          <button type="button" className="btn-secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" form="form-ciudad" className="btn-primario" disabled={guardando}>
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

      <form id="form-ciudad" onSubmit={handleSubmit(guardar)} noValidate>
        <label className="etiqueta" htmlFor="ciudad-nombre">
          Nombre de la ciudad
        </label>
        <input
          id="ciudad-nombre"
          type="text"
          placeholder="Ej. Santa Cruz de la Sierra"
          className={cx('campo', errors.nombre && 'campo-invalido')}
          autoFocus
          {...register('nombre', {
            required: requerido,
            maxLength: maximo(100),
            validate: nombreUnico(
              () => nombresOcupados,
              () => ciudad?.nombre ?? null,
            ),
          })}
        />
        {errors.nombre && <p className="mensaje-campo">{errorDe(errors.nombre)}</p>}
      </form>
    </Modal>
  )
}
