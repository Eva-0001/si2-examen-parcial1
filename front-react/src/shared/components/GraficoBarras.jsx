import { useState } from 'react'
import { cx } from '../utils/clases'

const formatoPorDefecto = (v) => String(v)

export default function GraficoBarras({ datos, formato = formatoPorDefecto }) {
  const [activo, setActivo] = useState(null)

  const ordenados = [...datos].sort((a, b) => b.valor - a.valor)
  const maximo = Math.max(1, ...ordenados.map((d) => d.valor))
  const porcentaje = (v) => Math.max(0, Math.min(100, (v / maximo) * 100))

  if (ordenados.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg bg-surface-container-low text-sm text-on-surface-variant">
        Sin datos
      </div>
    )
  }

  return (
    <ul className="space-y-3" role="list">
      {ordenados.map((d, i) => (
        <li key={d.etiqueta} className="group relative" onMouseEnter={() => setActivo(i)} onMouseLeave={() => setActivo(null)}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium text-on-surface">{d.etiqueta}</span>
            <span className="shrink-0 tabular-nums text-on-surface-variant">{formato(d.valor)}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-low">
            <div
              className={cx(
                'h-full rounded-r-[4px] bg-primary transition-all duration-500',
                activo !== null && activo !== i && 'opacity-80',
              )}
              style={{ width: `${porcentaje(d.valor)}%` }}
            ></div>
          </div>
          {activo === i && d.detalle && (
            <div className="pointer-events-none absolute right-0 top-full z-10 mt-1 rounded-lg bg-on-surface px-3 py-1.5 text-[11px] text-white shadow-xl">
              {d.detalle}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
