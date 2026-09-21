import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth, useAuthStore } from '@/core/stores/auth.store'
import { authService } from '@/core/services/auth.service'
import { usuariosService } from '@/core/services/usuarios.service'
import { toast } from '@/core/stores/toast.store'
import ModalCambiarPassword from '../components/ModalCambiarPassword'
import { correoValido, errorDe, marcarErrorApi, maximo, requerido } from '@/shared/utils/formularios'
import { cx } from '@/shared/utils/clases'

const ETIQUETA_ROL = {
  administrador: 'Administrador',
  encargado: 'Encargado de sucursal',
  cajero: 'Cajero',
  proveedor: 'Proveedor',
  cliente: 'Cliente',
}

const ETIQUETA_GENERO = {
  femenino: 'Femenino',
  masculino: 'Masculino',
}

const valoresDe = (usuario) => ({
  nombre: usuario?.nombre ?? '',
  apellido: usuario?.apellido ?? '',
  correo: usuario?.correo ?? '',
  genero: usuario?.genero ?? '',
})

export default function MiPerfil() {
  const auth = useAuth()
  const usuario = auth.usuario

  const [guardando, setGuardando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false)

  const [pristine, setPristine] = useState(true)
  const pristineRef = useRef(true)
  const marcarPristine = (valor) => {
    pristineRef.current = valor
    setPristine(valor)
  }

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ mode: 'onTouched', defaultValues: valoresDe(useAuthStore.getState().usuario) })

  useEffect(() => {
    authService
      .me()
      .then((u) => {
        useAuthStore.getState().actualizarUsuario(u)
        if (pristineRef.current) reset(valoresDe(u))
      })
      .catch(() => {
      })
  }, [reset])

  const iniciales = usuario ? `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase() : ''
  const etiquetaRol = auth.rol ? (ETIQUETA_ROL[auth.rol] ?? auth.rol) : ''
  const etiquetaGenero = usuario?.genero ? (ETIQUETA_GENERO[usuario.genero] ?? usuario.genero) : 'No especificado'

  const guardar = (valores) => {
    if (!usuario) return

    setGuardando(true)
    setErrorGeneral(null)

    const datos = {
      nombre: valores.nombre.trim(),
      apellido: valores.apellido.trim(),
      correo: valores.correo.trim().toLowerCase(),
      genero: valores.genero || null,
    }

    usuariosService
      .actualizar(usuario.id, datos)
      .then((actualizado) => {
        useAuthStore.getState().actualizarUsuario(actualizado)
        marcarPristine(true)
        setGuardando(false)
        toast.exito('Datos actualizados')
      })
      .catch((e) => {
        setGuardando(false)
        if (e.status === 409) {
          marcarErrorApi(setError, 'correo', 'Ese correo ya está registrado')
        } else if (e.status === 403) {
          setErrorGeneral('Por ahora solo un administrador puede editar estos datos. Contacta a la tienda.')
        } else {
          setErrorGeneral(e.message)
        }
      })
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-on-surface">Mi perfil</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Gestiona tu información personal y la seguridad de tu cuenta.
        </p>
      </div>

      {usuario && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <aside className="md:col-span-4 lg:col-span-3">
              <div className="tarjeta flex flex-col items-center text-center md:sticky md:top-24">
                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-surface-container bg-surface-container text-3xl font-bold text-primary">
                  {iniciales}
                </div>
                <h2 className="text-lg font-semibold text-on-surface">
                  {usuario.nombre} {usuario.apellido}
                </h2>
                <p className="text-sm text-on-surface-variant">{`@${usuario.username}`}</p>
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-primary">
                  <span className="material-symbols-outlined text-[14px]">verified_user</span>
                  {etiquetaRol}
                </span>

                <ul className="mt-6 w-full space-y-3 border-t border-outline-variant pt-4 text-left text-sm text-on-surface-variant">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-outline">mail</span>
                    <span className="truncate">{usuario.correo}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-outline">wc</span>
                    {etiquetaGenero}
                  </li>
                </ul>
              </div>
            </aside>

            <div className="space-y-6 md:col-span-8 lg:col-span-9">
              <section className="tarjeta">
                <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-primary">person</span>
                  Datos personales
                </h3>

                {errorGeneral && (
                  <div className="mb-5 rounded-lg border-l-4 border-error bg-error/5 p-3 text-sm text-on-surface" role="alert">
                    {errorGeneral}
                  </div>
                )}

                <form
                  onSubmit={(e) => handleSubmit(guardar)(e)}
                  onChange={() => pristine && marcarPristine(false)}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2"
                  noValidate
                >
                  <div>
                    <label className="etiqueta" htmlFor="nombre">
                      Nombre
                    </label>
                    <input
                      id="nombre"
                      type="text"
                      autoComplete="given-name"
                      className={cx('campo', errors.nombre && 'campo-invalido')}
                      {...register('nombre', { required: requerido, maxLength: maximo(100) })}
                    />
                    {errors.nombre && <p className="mensaje-campo">{errorDe(errors.nombre)}</p>}
                  </div>
                  <div>
                    <label className="etiqueta" htmlFor="apellido">
                      Apellido
                    </label>
                    <input
                      id="apellido"
                      type="text"
                      autoComplete="family-name"
                      className={cx('campo', errors.apellido && 'campo-invalido')}
                      {...register('apellido', { required: requerido, maxLength: maximo(100) })}
                    />
                    {errors.apellido && <p className="mensaje-campo">{errorDe(errors.apellido)}</p>}
                  </div>
                  <div>
                    <label className="etiqueta" htmlFor="correo">
                      Correo electrónico
                    </label>
                    <input
                      id="correo"
                      type="email"
                      autoComplete="email"
                      className={cx('campo', errors.correo && 'campo-invalido')}
                      {...register('correo', {
                        required: requerido,
                        validate: {
                          correo: correoValido,
                          largo: (v) => v.length <= 150 || maximo(150).message,
                        },
                      })}
                    />
                    {errors.correo && <p className="mensaje-campo">{errorDe(errors.correo)}</p>}
                  </div>
                  <div>
                    <label className="etiqueta" htmlFor="genero">
                      Género
                    </label>
                    <div className="relative">
                      <select id="genero" className="campo appearance-none pr-10" {...register('genero')}>
                        <option value="">Prefiero no decirlo</option>
                        <option value="femenino">Femenino</option>
                        <option value="masculino">Masculino</option>
                      </select>
                      <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                        expand_more
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="etiqueta" htmlFor="username">
                      Usuario
                    </label>
                    <input id="username" type="text" className="campo" value={usuario.username} disabled />
                    <p className="mt-1 text-xs text-on-surface-variant">El nombre de usuario no se puede cambiar.</p>
                  </div>

                  <div className="mt-2 flex justify-end md:col-span-2">
                    <button type="submit" className="btn-primario" disabled={guardando || pristine}>
                      {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="tarjeta">
                <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-primary">security</span>
                  Seguridad
                </h3>
                <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-outline-variant bg-surface-container-low p-4 md:flex-row md:items-center">
                  <div>
                    <h4 className="text-sm font-semibold text-on-surface">Contraseña</h4>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      Actualiza tu contraseña para mantener tu cuenta segura.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-secundario whitespace-nowrap"
                    onClick={() => setModalPasswordAbierto(true)}
                  >
                    <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                    Cambiar contraseña
                  </button>
                </div>
              </section>
            </div>
          </div>

          {modalPasswordAbierto && (
            <ModalCambiarPassword usuarioId={usuario.id} onCerrar={() => setModalPasswordAbierto(false)} />
          )}
        </>
      )}
    </>
  )
}
