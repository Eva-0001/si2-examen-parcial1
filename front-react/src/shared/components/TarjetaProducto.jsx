import { Link } from 'react-router'
import { useReferencias } from '@/core/stores/referencias.store'
import { useSucursalActivaStore } from '@/core/stores/sucursal-activa.store'
import { monedaBs } from '../utils/moneda-bs'
import { colorDesdeNombre, esColorClaro } from '../utils/colores'
import { cx } from '../utils/clases'

export default function TarjetaProducto({ grupo }) {
  const { nombre } = useReferencias()
  const sucursal = useSucursalActivaStore((s) => s.sucursal?.nombre)

  const muestras = grupo.colores.slice(0, 5).map((id) => {
    const nombreColor = nombre('colores', id) ?? ''
    return { id, nombre: nombreColor, color: colorDesdeNombre(nombreColor) }
  })
  const coloresExtra = Math.max(0, grupo.colores.length - 5)
  const categoria = nombre('categorias', grupo.categoria_id)

  let etiqueta
  switch (grupo.disponibilidad) {
    case 'disponible':
      etiqueta = { texto: sucursal ? `Disponible en ${sucursal}` : 'Disponible', clase: 'text-success' }
      break
    case 'otras':
      etiqueta = { texto: 'Disponible en otras sucursales', clase: 'text-warning' }
      break
    default:
      etiqueta = { texto: 'Agotado', clase: 'text-on-surface-variant' }
  }

  return (
    <Link
      to={`/producto/${grupo.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-container">
        {grupo.foto ? (
          <img
            src={grupo.foto}
            alt={grupo.nombre}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-primary/40">
            <span className="material-symbols-outlined text-[56px]">checkroom</span>
            <span className="text-[11px] font-medium">Sin foto</span>
          </div>
        )}
        {grupo.disponibilidad === 'agotado' && (
          <span className="absolute left-3 top-3 rounded-full bg-on-surface/80 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            Agotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        {categoria && (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">{categoria}</p>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-on-surface group-hover:text-primary">
          {grupo.nombre}
        </h3>
        <p className="text-base font-bold text-on-surface">
          {grupo.precioDesde !== null ? (
            <>
              {grupo.variantes.length > 1 && <span className="text-xs font-medium text-on-surface-variant">desde</span>}{' '}
              {monedaBs(grupo.precioDesde)}
            </>
          ) : (
            <span className="text-sm font-medium text-on-surface-variant">Consultar precio</span>
          )}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1">
            {muestras.map((m) => (
              <span
                key={m.id}
                className={cx('inline-block h-4 w-4 rounded-full', esColorClaro(m.color) ? 'border border-outline' : 'border border-outline-variant')}
                style={{ backgroundColor: m.color }}
                title={m.nombre}
              ></span>
            ))}
            {coloresExtra > 0 && <span className="text-[11px] text-on-surface-variant">+{coloresExtra}</span>}
          </div>
          <span className={cx('truncate text-[11px] font-semibold', etiqueta.clase)}>{etiqueta.texto}</span>
        </div>
      </div>
    </Link>
  )
}
