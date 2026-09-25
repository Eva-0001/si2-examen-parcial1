export default function ErrorConexion() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-surface-container">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant">cloud_off</span>
      </div>
      <h1 className="text-2xl font-semibold text-on-surface">No pudimos conectarnos al servidor</h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        Revisa tu conexión a internet o intenta de nuevo en unos segundos.
      </p>
      <button
        type="button"
        className="mt-8 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
        onClick={() => window.location.reload()}
      >
        Reintentar
      </button>
    </div>
  )
}
