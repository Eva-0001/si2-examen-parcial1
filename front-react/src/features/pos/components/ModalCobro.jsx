import { useState } from 'react'
import { ETIQUETA_METODO, ICONO_METODO, METODOS_PAGO } from '../pos.utils'
import { useEscape } from '@/shared/hooks/useEscape'
import { useAutofocus } from '@/shared/hooks/useAutofocus'
import { monedaBs } from '@/shared/utils/moneda-bs'
import { cx } from '@/shared/utils/clases'

export default function ModalCobro({ total, procesando = false, error = null, onConfirmar, onCancelar }) {
  useEscape(onCancelar)
  const autofocus = useAutofocus()

  const [metodo, setMetodo] = useState('efectivo')
  const [pagaCon, setPagaCon] = useState('')

  const n = Number(pagaCon.replace(',', '.'))
  const montoPagado = Number.isFinite(n) ? n : 0
  const vuelto = Math.max(0, montoPagado - total)
  const falta = Math.max(0, total - montoPagado)
  const listo = metodo !== 'efectivo' || montoPagado >= total

  const base = [
    Math.ceil(total),
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 200) * 200,
  ]
  const sugerencias = [...new Set(base)].filter((x) => x >= total).slice(0, 4)

  const enviar = () => {
    if (!listo || procesando) return
    const efectivo = metodo === 'efectivo'
    onConfirmar({ metodo, pagaCon: efectivo ? montoPagado : null, vuelto: efectivo ? vuelto : 0 })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-on-surface/50 backdrop-blur-sm" onClick={onCancelar} aria-hidden="true"></div>

      <div
        className="relative flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <h2 className="text-lg font-semibold text-on-surface">Cobrar</h2>
          <button type="button" className="btn-icono" onClick={onCancelar} aria-label="Cerrar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-5">
          <div className="rounded-xl bg-surface-container p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Total a cobrar</p>
            <p className="mt-1 text-5xl font-bold tabular-nums text-on-surface">{monedaBs(total)}</p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border-l-4 border-error bg-error/5 p-3 text-sm text-on-surface" role="alert">
              <span className="font-semibold text-error">No se pudo registrar la venta.</span> {error}
            </div>
          )}

          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Método de pago</p>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {METODOS_PAGO.map((m) => (
              <button
                key={m}
                type="button"
                className={cx(
                  'flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 text-sm font-semibold transition-colors',
                  metodo === m
                    ? 'border-primary bg-surface-container text-primary'
                    : 'border-outline-variant text-on-surface hover:border-primary',
                )}
                onClick={() => setMetodo(m)}
              >
                <span className="material-symbols-outlined text-[28px]">{ICONO_METODO[m]}</span>
                {ETIQUETA_METODO[m]}
              </button>
            ))}
          </div>

          {metodo === 'efectivo' ? (
            <div className="mt-5">
              <label className="etiqueta" htmlFor="cobro-paga">
                Paga con
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-on-surface-variant">
                  Bs
                </span>
                <input
                  ref={autofocus}
                  id="cobro-paga"
                  type="text"
                  inputMode="decimal"
                  className="campo py-3 pl-12 text-2xl font-bold tabular-nums"
                  placeholder="0.00"
                  value={pagaCon}
                  onChange={(e) => setPagaCon(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && enviar()}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sugerencias.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1 text-xs font-semibold text-on-surface hover:border-primary hover:text-primary"
                    onClick={() => setPagaCon(String(s))}
                  >
                    Bs {s}
                  </button>
                ))}
              </div>
              <div
                className={cx(
                  'mt-4 flex items-center justify-between rounded-xl p-4',
                  listo ? 'bg-success/10' : 'bg-surface-container-low',
                )}
              >
                <span className={cx('text-sm font-semibold', listo ? 'text-success' : 'text-on-surface-variant')}>
                  {listo ? 'Vuelto' : 'Falta'}
                </span>
                <span className={cx('text-3xl font-bold tabular-nums', listo ? 'text-success' : 'text-on-surface-variant')}>
                  {monedaBs(listo ? vuelto : falta)}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-5 flex items-start gap-2 rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">info</span>
              {metodo === 'tarjeta'
                ? 'Cobra en el POS bancario y confirma cuando el pago esté aprobado.'
                : 'Muestra el QR del comercio al cliente y confirma cuando llegue la notificación del banco.'}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-3 border-t border-outline-variant px-6 py-4">
          <button type="button" className="btn-secundario" onClick={onCancelar} disabled={procesando}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primario px-6 py-3 text-base"
            disabled={!listo || procesando}
            onClick={enviar}
          >
            {procesando ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Registrando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">check_circle</span> Confirmar cobro
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  )
}
