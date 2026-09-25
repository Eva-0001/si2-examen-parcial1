import { useState } from 'react'
import { cx } from '../utils/clases'

export default function CampoPassword({
  id = '',
  placeholder = '••••••••',
  autocomplete = 'current-password',
  invalido = false,
  ref,
  ...resto
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        ref={ref}
        id={id || undefined}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autocomplete}
        className={cx('campo pr-11', invalido && 'campo-invalido')}
        {...resto}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 flex -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary"
        tabIndex={-1}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        onClick={() => setVisible(!visible)}
      >
        <span className="material-symbols-outlined text-[20px]">{visible ? 'visibility_off' : 'visibility'}</span>
      </button>
    </div>
  )
}
