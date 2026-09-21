import { vigenciaDe } from '../utils/fechas'
import { formatoFecha } from '../utils/formato'
import { cx } from '../utils/clases'

export default function VigenciaPromocion({ fechaInicio, fechaFinal }) {
  const v = vigenciaDe(fechaInicio, fechaFinal)
  const { estado, diasRestantes } = v

  let texto
  if (estado === 'vencida') texto = 'Finalizada'
  else if (estado === 'proxima') texto = diasRestantes === 1 ? 'Empieza mañana' : `Empieza en ${diasRestantes} días`
  else if (diasRestantes === 0) texto = 'Último día'
  else texto = diasRestantes === 1 ? 'Queda 1 día' : `Quedan ${diasRestantes} días`

  const claseTexto = estado !== 'vigente' ? 'text-on-surface-variant' : diasRestantes <= 3 ? 'text-promo-accent' : 'text-primary'
  const claseBarra = estado !== 'vigente' ? 'bg-outline' : diasRestantes <= 3 ? 'bg-promo-accent' : 'bg-primary'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-on-surface-variant">
          {formatoFecha(fechaInicio, 'd MMM')} – {formatoFecha(fechaFinal, 'd MMM yyyy')}
        </span>
        <span className={cx('font-semibold', claseTexto)}>{texto}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low" aria-hidden="true">
        <div className={cx('h-full rounded-full transition-all', claseBarra)} style={{ width: `${v.porcentaje}%` }}></div>
      </div>
    </div>
  )
}
