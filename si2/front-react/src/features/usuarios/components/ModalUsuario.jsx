import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { usuariosService } from '@/core/services/usuarios.service'
import { toast } from '@/core/stores/toast.store'
import Modal from '@/shared/components/Modal'
import CampoPassword from '@/shared/components/CampoPassword'
import FuerzaPassword from '@/shared/components/FuerzaPassword'
import {
  correoValido,
  errorDe,
  marcarErrorApi,
  maximo,
  minimo,
  numeroONulo,
  patronUsername,
  requerido,
} from '@/shared/utils/formularios'
import { MIN_PASSWORD } from '@/shared/utils/password'
import { estiloRol } from '@/shared/utils/roles'
import { cx } from '@/shared/utils/clases'

export default function ModalUsuario({ usuario = null, roles = [], onCerrar, onGuardado }) {
  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)
  const esEdicion = usuario !== null

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      nombre: usuario?.nombre ?? '',
      apellido: usuario?.apellido ?? '',
      correo: usuario?.correo ?? '',
      username: usuario?.username ?? '',
      genero: usuario?.genero ?? '',
      rol_id: usuario?.rol_id ?? null,
      password: '',
    },
  })

  const password = useWatch({ control, name: 'password' }) ?? ''

  const guardar = (v) => {
    setGuardando(true)
    setErrorGeneral(null)

    const datos = {
      nombre: v.nombre.trim(),
      apellido: v.apellido.trim(),
      correo: v.correo.trim().toLowerCase(),
      username: v.username.trim(),
      genero: v.genero || null,
      rol_id: v.rol_id,
      password: v.password,
    }

    // eslint-disable-next-line no-unused-vars
    const { password: _sinPassword, ...cambios } = datos
    const peticion = usuario ? usuariosService.actualizar(usuario.id, cambios) : usuariosService.crear(datos)

    peticion
      .then((guardado) => {
        toast.exito(usuario ? 'Usuario actualizado' : 'Usuario creado')
        onGuardado(guardado)
      })
      .catch((e) => {
        setGuardando(false)
        const texto = e.message.toLowerCase()
        if (e.status === 409 && texto.includes('username')) {
          marcarErrorApi(setError, 'username', 'Ese nombre de usuario ya está en uso')
        } else if (e.status === 409 && texto.includes('correo')) {
          marcarErrorApi(setError, 'correo', 'Ese correo ya está registrado')
        } else {
          setErrorGeneral(e.message)
        }
      })
  }

  return (
    <Modal
      titulo={esEdicion ? 'Editar usuario' : 'Nuevo usuario'}
      ancho="ancho"
      onCerrar={onCerrar}
      footer={
        <>
          <button type="button" className="btn-secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" form="form-usuario" className="btn-primario" disabled={guardando}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </>
      }
    >
      {errorGeneral && (
        <div className="mb-5 rounded-lg border-l-4 border-error bg-error/5 p-3 text-sm text-on-surface" role="alert">
          {errorGeneral}
        </div>
      )}

      <form
        id="form-usuario"
        onSubmit={handleSubmit(guardar)}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        noValidate
      >
        <div>
          <label className="etiqueta" htmlFor="usr-nombre">
            Nombre
          </label>
          <input
            id="usr-nombre"
            type="text"
            className={cx('campo', errors.nombre && 'campo-invalido')}
            autoFocus
            {...register('nombre', { required: requerido, maxLength: maximo(100) })}
          />
          {errors.nombre && <p className="mensaje-campo">{errorDe(errors.nombre)}</p>}
        </div>
        <div>
          <label className="etiqueta" htmlFor="usr-apellido">
            Apellido
          </label>
          <input
            id="usr-apellido"
            type="text"
            className={cx('campo', errors.apellido && 'campo-invalido')}
            {...register('apellido', { required: requerido, maxLength: maximo(100) })}
          />
          {errors.apellido && <p className="mensaje-campo">{errorDe(errors.apellido)}</p>}
        </div>

        <div>
          <label className="etiqueta" htmlFor="usr-correo">
            Correo
          </label>
          <input
            id="usr-correo"
            type="email"
            placeholder="nombre@tienda.com"
            className={cx('campo', errors.correo && 'campo-invalido')}
            {...register('correo', { required: requerido, validate: correoValido, maxLength: maximo(150) })}
          />
          {errors.correo && <p className="mensaje-campo">{errorDe(errors.correo)}</p>}
        </div>
        <div>
          <label className="etiqueta" htmlFor="usr-username">
            Usuario
          </label>
          <input
            id="usr-username"
            type="text"
            autoComplete="off"
            className={cx('campo', errors.username && 'campo-invalido')}
            {...register('username', {
              required: requerido,
              minLength: minimo(3),
              maxLength: maximo(50),
              pattern: patronUsername,
            })}
          />
          {errors.username && <p className="mensaje-campo">{errorDe(errors.username)}</p>}
        </div>

        <div>
          <label className="etiqueta" htmlFor="usr-genero">
            Género
          </label>
          <div className="relative">
            <select id="usr-genero" className="campo appearance-none pr-10" {...register('genero')}>
              <option value="">Prefiero no decirlo</option>
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              expand_more
            </span>
          </div>
        </div>
        <div>
          <label className="etiqueta" htmlFor="usr-rol">
            Rol
          </label>
          <div className="relative">
            <select
              id="usr-rol"
              className={cx('campo appearance-none pr-10', errors.rol_id && 'campo-invalido')}
              {...register('rol_id', { required: requerido, setValueAs: numeroONulo })}
            >
              <option value="" disabled>
                Selecciona un rol
              </option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {estiloRol(rol.nombre).etiqueta}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              expand_more
            </span>
          </div>
          {errors.rol_id && <p className="mensaje-campo">{errorDe(errors.rol_id)}</p>}
        </div>

        {!esEdicion ? (
          <div className="md:col-span-2">
            <label className="etiqueta" htmlFor="usr-password">
              Contraseña
            </label>
            <CampoPassword
              id="usr-password"
              autocomplete="new-password"
              placeholder="Mínimo 8 caracteres"
              invalido={!!errors.password}
              {...register('password', { required: requerido, minLength: minimo(MIN_PASSWORD) })}
            />
            {errors.password && <p className="mensaje-campo">{errorDe(errors.password)}</p>}
            <FuerzaPassword password={password} />
          </div>
        ) : (
          <p className="flex items-start gap-2 rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant md:col-span-2">
            <span className="material-symbols-outlined text-[16px] text-primary">info</span>
            La contraseña solo la puede cambiar el propio usuario desde "Mi perfil", porque el sistema pide la
            contraseña actual.
          </p>
        )}
      </form>
    </Modal>
  )
}
