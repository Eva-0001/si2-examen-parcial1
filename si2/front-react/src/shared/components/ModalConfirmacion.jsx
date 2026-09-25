import { useEscape } from '../hooks/useEscape'

export default function ModalConfirmacion({
  titulo,
  mensaje = 'Esta acción no se puede deshacer',
  textoBoton = 'Eliminar',
  error = null,
  cargando = false,
  onConfirmar,
  onCancelar,
}) {
  useEscape(onCancelar)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/50 backdrop-blur-sm" onClick={onCancelar} aria-hidden="true"></div>

      <div
        className="relative w-full max-w-[400px] rounded-xl bg-surface-container-lowest p-6 text-center shadow-xl"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-error">warning</span>
        </div>

        <h2 className="text-lg font-semibold text-on-surface">{titulo}</h2>

        {error ? (
          <>
            <p className="mt-2 text-sm font-medium text-error">{error}</p>
            <div className="mt-6">
              <button
                type="button"
                className="w-full rounded-lg border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                onClick={onCancelar}
              >
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-on-surface-variant">{mensaje}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-lg border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                onClick={onCancelar}
                disabled={cargando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-error px-4 py-2.5 text-sm font-semibold text-error hover:bg-error/5 disabled:opacity-50"
                onClick={onConfirmar}
                disabled={cargando}
              >
                {cargando ? 'Eliminando...' : textoBoton}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
