import { useNavigate } from 'react-router'
import { useAuthStore } from '@/core/stores/auth.store'

export default function SesionExpirada() {
  const sesionExpirada = useAuthStore((s) => s.sesionExpirada)
  const cerrarAviso = useAuthStore((s) => s.cerrarAvisoSesion)
  const navigate = useNavigate()

  if (!sesionExpirada) return null

  const irALogin = () => {
    cerrarAviso()
    navigate('/login')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/50 backdrop-blur-sm" aria-hidden="true"></div>

      <div
        className="relative w-full max-w-[400px] rounded-xl bg-surface-container-lowest p-6 text-center shadow-xl"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container">
          <span className="material-symbols-outlined text-primary">schedule</span>
        </div>
        <h2 className="text-lg font-semibold text-on-surface">Tu sesión expiró</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Por seguridad, la sesión dura 60 minutos. Vuelve a iniciar sesión para continuar.
        </p>
        <button
          type="button"
          className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
          onClick={irALogin}
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  )
}
