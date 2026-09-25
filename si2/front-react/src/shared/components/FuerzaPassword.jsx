import { ETIQUETA_FUERZA, nivelFuerza } from '../utils/password'
import { cx } from '../utils/clases'

const COLOR_BARRA = {
  1: 'bg-error',
  2: 'bg-warning',
  3: 'bg-primary',
  4: 'bg-success',
}

const COLOR_TEXTO = {
  1: 'text-error',
  2: 'text-warning',
  3: 'text-primary',
  4: 'text-success',
}

const BARRAS = [1, 2, 3, 4]

export default function FuerzaPassword({ password = '' }) {
  const nivel = nivelFuerza(password)
  const colorBarra = COLOR_BARRA[nivel] ?? 'bg-outline-variant'
  const colorTexto = COLOR_TEXTO[nivel] ?? 'text-on-surface-variant'

  return (
    <>
      <div className="mt-2 flex h-1.5 w-full gap-1" aria-hidden="true">
        {BARRAS.map((barra) => (
          <div
            key={barra}
            className={cx('h-full flex-1 rounded-full transition-colors', barra <= nivel ? colorBarra : 'bg-outline-variant')}
          ></div>
        ))}
      </div>
      <p className={cx('mt-1 text-xs', nivel === 0 ? 'text-on-surface-variant' : colorTexto)}>
        {nivel === 0 ? (
          'Mínimo 8 caracteres. Suma mayúsculas, números y símbolos.'
        ) : (
          <>
            Nivel de seguridad: <span className="font-semibold">{ETIQUETA_FUERZA[nivel]}</span>
          </>
        )}
      </p>
    </>
  )
}
