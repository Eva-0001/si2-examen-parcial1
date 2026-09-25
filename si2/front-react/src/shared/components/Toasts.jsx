import { useToastStore } from '@/core/stores/toast.store'
import { cx } from '../utils/clases'

const ICONOS = {
  exito: 'check_circle',
  error: 'error',
  advertencia: 'warning',
  info: 'info',
}

const BORDES = {
  exito: 'border-success',
  error: 'border-error',
  advertencia: 'border-warning',
  info: 'border-primary',
}

const TEXTOS = {
  exito: 'text-success',
  error: 'text-error',
  advertencia: 'text-warning',
  info: 'text-primary',
}

export default function Toasts() {
  const toasts = useToastStore((s) => s.toasts)
  const cerrar = useToastStore((s) => s.cerrar)

  return (
    <div className="fixed top-4 right-4 z-100 flex w-80 flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cx(
            'flex items-center gap-3 rounded-lg border-l-4 bg-surface-container-lowest px-4 py-3 shadow-card',
            BORDES[toast.tipo],
          )}
        >
          <span className={cx('material-symbols-outlined text-[20px]', TEXTOS[toast.tipo])}>{ICONOS[toast.tipo]}</span>
          <p className="flex-1 text-sm text-on-surface">{toast.mensaje}</p>
          <button
            type="button"
            className="text-on-surface-variant hover:text-on-surface"
            onClick={() => cerrar(toast.id)}
            aria-label="Cerrar notificación"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      ))}
    </div>
  )
}
