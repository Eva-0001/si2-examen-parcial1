export default function EstadoVacio({ icono = 'inventory_2', titulo, descripcion = null, textoAccion = null, onAccion }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
        <span className="material-symbols-outlined text-[32px] text-primary">{icono}</span>
      </div>
      <h3 className="text-lg font-semibold text-on-surface">{titulo}</h3>
      {descripcion && <p className="mt-1 max-w-sm text-sm text-on-surface-variant">{descripcion}</p>}
      {textoAccion && (
        <button
          type="button"
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
          onClick={() => onAccion?.()}
        >
          {textoAccion}
        </button>
      )}
    </div>
  )
}
