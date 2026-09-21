import { cx } from '../utils/clases'

const TAMANOS = {
  sm: 'h-10 w-10 rounded-lg',
  md: 'h-14 w-14 rounded-lg',
  lg: 'h-20 w-20 rounded-xl',
}

export default function Miniatura({ url = null, alt = '', icono = 'checkroom', tamano = 'sm' }) {
  return (
    <div className={cx('flex shrink-0 items-center justify-center overflow-hidden bg-surface-container', TAMANOS[tamano])}>
      {url ? (
        <img src={url} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span className={cx('material-symbols-outlined text-primary/40', tamano === 'sm' ? 'text-[20px]' : 'text-[28px]')}>
          {icono}
        </span>
      )}
    </div>
  )
}
