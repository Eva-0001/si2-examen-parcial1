import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { authService } from '@/core/services/auth.service'
import { toast } from '@/core/stores/toast.store'
import PanelAuth from '../components/PanelAuth'
import CampoPassword from '@/shared/components/CampoPassword'
import FuerzaPassword from '@/shared/components/FuerzaPassword'
import {
  correoValido,
  errorDe,
  marcarErrorApi,
  maximo,
  minimo,
  patronUsername,
  requerido,
} from '@/shared/utils/formularios'
import { MIN_PASSWORD } from '@/shared/utils/password'
import { cx } from '@/shared/utils/clases'

export default function Registro() {
  const navigate = useNavigate()
  const [cargando, setCargando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState(null)

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      nombre: '',
      apellido: '',
      correo: '',
      username: '',
      genero: '',
      password: '',
      terminos: false,
    },
  })

  const password = useWatch({ control, name: 'password' }) ?? ''

  const enviar = async (valores) => {
    setCargando(true)
    setErrorGeneral(null)

    const datos = {
      nombre: valores.nombre.trim(),
      apellido: valores.apellido.trim(),
      correo: valores.correo.trim().toLowerCase(),
      username: valores.username.trim(),
      genero: valores.genero || null,
      password: valores.password,
    }

    try {
      const res = await authService.registro(datos)
      toast.exito(`¡Bienvenido, ${res.usuario.nombre}! Tu cuenta ya está lista.`)
      navigate('/')
    } catch (e) {
      setCargando(false)
      mostrarError(e)
    }
  }

  const mostrarError = (e) => {
    const texto = e.message.toLowerCase()
    if (e.status === 409 && texto.includes('username')) {
      marcarErrorApi(setError, 'username', 'Ese nombre de usuario ya está en uso')
      return
    }
    if (e.status === 409 && texto.includes('correo')) {
      marcarErrorApi(setError, 'correo', 'Ese correo ya está registrado')
      return
    }
    setErrorGeneral(e.message)
  }

  return (
    <PanelAuth ancho="ancho">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-on-surface">Crear cuenta</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Reserva prendas, sigue tus pedidos y compra desde donde estés.
        </p>
      </div>

      {errorGeneral && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border-l-4 border-error bg-error/5 p-4" role="alert">
          <span className="material-symbols-outlined mt-0.5 text-[20px] text-error">error</span>
          <div className="text-sm">
            <p className="font-semibold text-error">No pudimos crear tu cuenta</p>
            <p className="mt-0.5 text-on-surface">{errorGeneral}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(enviar)} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="nombre">
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              autoComplete="given-name"
              placeholder="Tu nombre"
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
              placeholder="Tu apellido"
              className={cx('campo', errors.apellido && 'campo-invalido')}
              {...register('apellido', { required: requerido, maxLength: maximo(100) })}
            />
            {errors.apellido && <p className="mensaje-campo">{errorDe(errors.apellido)}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="correo">
              Correo
            </label>
            <input
              id="correo"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
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
            <label className="etiqueta" htmlFor="username">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="usuario"
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

        <div>
          <label className="etiqueta" htmlFor="password">
            Contraseña
          </label>
          <CampoPassword
            id="password"
            autocomplete="new-password"
            invalido={!!errors.password}
            {...register('password', { required: requerido, minLength: minimo(MIN_PASSWORD) })}
          />
          {errors.password && <p className="mensaje-campo">{errorDe(errors.password)}</p>}
          <FuerzaPassword password={password} />
        </div>

        <div className="flex items-start gap-3">
          <input
            id="terminos"
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-outline accent-primary"
            {...register('terminos', { validate: (v) => v === true })}
          />
          <div>
            <label htmlFor="terminos" className="cursor-pointer text-sm text-on-surface-variant">
              Acepto los{' '}
              <a href="#" className="font-semibold text-primary hover:underline">
                Términos y condiciones
              </a>{' '}
              y la{' '}
              <a href="#" className="font-semibold text-primary hover:underline">
                Política de privacidad
              </a>{' '}
              de FashionStore.
            </label>
            {errors.terminos && <p className="mensaje-campo">Tienes que aceptar los términos para continuar</p>}
          </div>
        </div>

        <button type="submit" className="btn-primario w-full py-3" disabled={cargando}>
          {cargando ? (
            'Creando tu cuenta...'
          ) : (
            <>
              Crear cuenta
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-on-surface-variant">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </PanelAuth>
  )
}
