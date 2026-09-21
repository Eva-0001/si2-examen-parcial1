import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { authService } from '@/core/services/auth.service'
import { authActual } from '@/core/stores/auth.store'
import { toast } from '@/core/stores/toast.store'
import PanelAuth from '../components/PanelAuth'
import CampoPassword from '@/shared/components/CampoPassword'
import { errorDe, requerido } from '@/shared/utils/formularios'
import { cx } from '@/shared/utils/clases'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onTouched', defaultValues: { username: '', password: '' } })

  const destino = () => {
    const redirect = searchParams.get('redirect')
    return redirect?.startsWith('/') ? redirect : authActual().rutaInicio()
  }

  const enviar = async (valores) => {
    setCargando(true)
    setError(null)

    try {
      await authService.login(valores)
      navigate(destino())
    } catch (e) {
      setError(e.status === 401 ? 'Usuario o contraseña incorrectos' : e.message)
      setCargando(false)
    }
  }

  const olvideContrasena = () => {
    toast.info('Pídele al administrador de la tienda que restablezca tu contraseña.')
  }

  return (
    <PanelAuth>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-on-surface">Bienvenido de vuelta</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Ingresa tus credenciales para continuar.</p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border-l-4 border-error bg-error/5 p-4" role="alert">
          <span className="material-symbols-outlined mt-0.5 text-[20px] text-error">error</span>
          <div className="text-sm">
            <p className="font-semibold text-error">Error de autenticación</p>
            <p className="mt-0.5 text-on-surface">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(enviar)} className="space-y-5" noValidate>
        <div>
          <label className="etiqueta" htmlFor="username">
            Usuario
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="tu_usuario"
            className={cx('campo', errors.username && 'campo-invalido')}
            {...register('username', { required: requerido })}
          />
          {errors.username && <p className="mensaje-campo">{errorDe(errors.username)}</p>}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="etiqueta mb-0" htmlFor="password">
              Contraseña
            </label>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:text-primary-hover hover:underline"
              onClick={olvideContrasena}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <CampoPassword
            id="password"
            autocomplete="current-password"
            invalido={!!errors.password}
            {...register('password', { required: requerido })}
          />
          {errors.password && <p className="mensaje-campo">{errorDe(errors.password)}</p>}
        </div>

        <button type="submit" className="btn-primario w-full py-3" disabled={cargando}>
          {cargando ? (
            'Entrando...'
          ) : (
            <>
              Entrar
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </>
          )}
        </button>
      </form>

      <p className="mt-8 border-t border-outline-variant pt-6 text-center text-sm text-on-surface-variant">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-primary hover:underline">
          Regístrate
        </Link>
      </p>
    </PanelAuth>
  )
}
