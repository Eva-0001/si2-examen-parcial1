import { cx } from '@/shared/utils/clases'

export default function InterruptorBajoStock({ activo, onCambiar }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface">
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        className={cx('relative h-6 w-11 rounded-full transition-colors', activo ? 'bg-primary' : 'bg-outline')}
        onClick={() => onCambiar(!activo)}
      >
        <span
          className={cx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-transform',
            activo ? 'translate-x-5.5' : 'translate-x-0.5',
          )}
        ></span>
      </button>
      Solo bajo stock
    </label>
  )
}
