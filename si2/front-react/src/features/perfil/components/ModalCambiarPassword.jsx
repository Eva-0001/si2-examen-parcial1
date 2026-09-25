import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { usuariosService } from '@/core/services/usuarios.service'
import { toast } from '@/core/stores/toast.store'
import Modal from '@/shared/components/Modal'
import CampoPassword from '@/shared/components/CampoPassword'
import FuerzaPassword from '@/shared/components/FuerzaPassword'
import { coincideCon, errorDe, marcarErrorApi, minimo, requerido } from '@/shared/utils/formularios'
import { MIN_PASSWORD } from '@/shared/utils/password'

export default function ModalCambiarPassword({ usuarioId, onCerrar }) {
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setError,
    formState: { errors, touchedFields, isSubmitted },
  } = useForm({ mode: 'onTouched', defaultValues: { actual: '', nueva: '', repetir: '' } })

  const nueva = useWatch({ control, name: 'nueva' }) ?? ''

  const errorRepetir = touchedFields.repetir || isSubmitted ? errors.repetir : undefined

  const guardar = ({ actual, nueva: nuevaPassword }) => {
    setGuardando(true)
    setErrorGeneral(null)

    usuariosService
      .cambiarPassword(usuarioId, { password_actual: actual, password_nuevo: nuevaPassword })
      .then(() => {
        toast.exito('Contraseña actualizada')
        onCerrar()
      })
      .catch((e) => {
        setGuardando(false)
        if (e.status === 400) {
          marcarErrorApi(setError, 'actual', 'La contraseña actual es incorrecta')
        } else {
          setErrorGeneral(e.message)
        }
      })
  }

  return (
    <Modal
      titulo="Cambiar contraseña"
      onCerrar={onCerrar}
      footer={
        <>
          <button type="button" className="btn-secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" form="form-password" className="btn-primario" disabled={guardando}>
            {guardando ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </>
      }
    >
      {errorGeneral && (
        <div className="mb-5 rounded-lg border-l-4 border-error bg-error/5 p-3 text-sm text-on-surface" role="alert">
          {errorGeneral}
        </div>
      )}

      <form id="form-password" onSubmit={handleSubmit(guardar)} className="space-y-5" noValidate>
        <div>
          <label className="etiqueta" htmlFor="password-actual">
            Contraseña actual
          </label>
          <CampoPassword
            id="password-actual"
            autocomplete="current-password"
            placeholder="Tu contraseña actual"
            invalido={!!errors.actual}
            {...register('actual', { required: requerido })}
          />
          {errors.actual && <p className="mensaje-campo">{errorDe(errors.actual)}</p>}
        </div>

        <div>
          <label className="etiqueta" htmlFor="password-nueva">
            Nueva contraseña
          </label>
          <CampoPassword
            id="password-nueva"
            autocomplete="new-password"
            placeholder="Mínimo 8 caracteres"
            invalido={!!errors.nueva}
            {...register('nueva', { required: requerido, minLength: minimo(MIN_PASSWORD), deps: ['repetir'] })}
          />
          {errors.nueva && <p className="mensaje-campo">{errorDe(errors.nueva)}</p>}
          <FuerzaPassword password={nueva} />
        </div>

        <div>
          <label className="etiqueta" htmlFor="password-repetir">
            Repetir contraseña
          </label>
          <CampoPassword
            id="password-repetir"
            autocomplete="new-password"
            placeholder="Repite la nueva contraseña"
            invalido={!!errorRepetir}
            {...register('repetir', { required: requerido, validate: coincideCon(() => getValues('nueva')) })}
          />
          {errorRepetir && <p className="mensaje-campo">{errorDe(errorRepetir)}</p>}
        </div>
      </form>
    </Modal>
  )
}
