import { useEscape } from '../hooks/useEscape'
import { cx } from '../utils/clases'

export default function Modal({ titulo, ancho = 'chico', onCerrar, footer, children }) {
  useEscape(onCerrar)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/50 backdrop-blur-sm" onClick={onCerrar} aria-hidden="true"></div>

      <div
        className={cx(
          'relative flex max-h-[90vh] w-full flex-col rounded-xl bg-surface-container-lowest shadow-xl',
          ancho === 'ancho' ? 'max-w-[720px]' : 'max-w-[480px]',
        )}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <h2 className="text-lg font-semibold text-on-surface">{titulo}</h2>
          <button
            type="button"
            className="text-on-surface-variant hover:text-on-surface"
            onClick={onCerrar}
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-5">{children}</div>

        <footer className="flex justify-end gap-3 border-t border-outline-variant px-6 py-4">{footer}</footer>
      </div>
    </div>
  )
}
