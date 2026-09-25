import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { rolesService } from '../services/roles.service'
import { toast } from '@/core/stores/toast.store'
import Modal from '@/shared/components/Modal'
import { errorDe, marcarErrorApi, maximo, nombreUnico, requerido } from '@/shared/utils/formularios'
import { cx } from '@/shared/utils/clases'

const patronRol = { value: /^[a-záéíóúñ_]+$/i, message: 'Solo letras, números, punto y guion bajo' }

export default function ModalRol({ rol = null, nombresOcupados = [], onCerrar, onGuardado }) {
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ mode: 'onTouched', defaultValues: { nombre: rol?.nombre ?? '' } })

  const guardar = (valores) => {
    setGuardando(true)
    setErrorGeneral(null)

    const datos = { nombre: valores.nombre.trim().toLowerCase() }
    const peticion = rol ? rolesService.actualizar(rol.id, datos) : rolesService.crear(datos)

    peticion
      .then((guardado) => {
        toast.exito(rol ? 'Rol actualizado' : 'Rol creado')
        onGuardado(guardado)
      })
      .catch((e) => {
        setGuardando(false)
        if (e.status === 409 || (e.status === 500 && rol)) {
          marcarErrorApi(setError, 'nombre', 'Ya existe un rol con ese nombre')
        } else {
          setErrorGeneral(e.message)
        }
      })
  }

  return (
    <Modal
      titulo={rol ? 'Editar rol' : 'Nuevo rol'}
      onCerrar={onCerrar}
      footer={
        <>
          <button type="button" className="btn-secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" form="form-rol" className="btn-primario" disabled={guardando}>
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

      <form id="form-rol" onSubmit={handleSubmit(guardar)} noValidate>
        <label className="etiqueta" htmlFor="rol-nombre">
          Nombre del rol
        </label>
        <input
          id="rol-nombre"
          type="text"
          placeholder="Ej. supervisor"
          className={cx('campo lowercase', errors.nombre && 'campo-invalido')}
          autoFocus
          {...register('nombre', {
            required: requerido,
            maxLength: maximo(50),
            pattern: patronRol,
            validate: nombreUnico(
              () => nombresOcupados,
              () => rol?.nombre ?? null,
            ),
          })}
        />
        {errors.nombre ? (
          <p className="mensaje-campo">{errorDe(errors.nombre)}</p>
        ) : (
          <p className="mt-1 text-xs text-on-surface-variant">
            Se guarda en minúsculas y sin espacios. Los permisos de cada rol los define el sistema.
          </p>
        )}
      </form>
    </Modal>
  )
}
