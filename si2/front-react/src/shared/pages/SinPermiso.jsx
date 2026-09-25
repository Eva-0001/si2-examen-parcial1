import { Link } from 'react-router'
import { useAuth } from '@/core/stores/auth.store'

export default function SinPermiso() {
  const auth = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-surface-container">
        <span className="material-symbols-outlined text-[48px] text-primary">lock</span>
      </div>
      <h1 className="text-2xl font-semibold text-on-surface">No tienes permiso para ver esta página</h1>
      {auth.rol && (
        <p className="mt-2 text-sm text-on-surface-variant">
          Tu rol actual es <span className="font-semibold text-on-surface">{auth.rol}</span>.
        </p>
      )}
      <Link
        to={auth.rutaInicio()}
        className="mt-8 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
