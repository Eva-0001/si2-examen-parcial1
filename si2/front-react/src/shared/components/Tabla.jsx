import Skeleton from './Skeleton'
import EstadoVacio from './EstadoVacio'

export default function Tabla({
  cargando = false,
  error = null,
  vacio = false,
  filasSkeleton = 5,
  iconoVacio = 'inventory_2',
  tituloVacio = 'No hay registros todavía',
  descripcionVacio = null,
  textoAccionVacio = null,
  onAccionVacia,
  onReintentar,
  pie,
  children,
}) {
  let contenido
  if (cargando) {
    contenido = (
      <div className="p-4">
        <Skeleton tipo="tabla" cantidad={filasSkeleton} />
      </div>
    )
  } else if (error) {
    contenido = (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
          <span className="material-symbols-outlined text-[32px] text-error">cloud_off</span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface">No pudimos cargar los datos</h3>
        <p className="mt-1 max-w-sm text-sm text-on-surface-variant">{error}</p>
        <button type="button" className="btn-secundario mt-6" onClick={() => onReintentar?.()}>
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Reintentar
        </button>
      </div>
    )
  } else if (vacio) {
    contenido = (
      <EstadoVacio
        icono={iconoVacio}
        titulo={tituloVacio}
        descripcion={descripcionVacio}
        textoAccion={textoAccionVacio}
        onAccion={onAccionVacia}
      />
    )
  } else {
    contenido = (
      <>
        <div className="tabla max-h-[70vh] overflow-auto">{children}</div>
        <footer className="flex items-center justify-between border-t border-outline-variant px-6 py-3 text-xs text-on-surface-variant empty:hidden">
          {pie}
        </footer>
      </>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card">
      {contenido}
    </div>
  )
}
