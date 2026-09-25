import { useState } from 'react'
import { reservasService } from '../services/reservas.service'
import { HORARIOS, horaCorta } from '../reservas.utils'
import { toast } from '@/core/stores/toast.store'
import Modal from '@/shared/components/Modal'
import { hoyISO } from '@/shared/utils/fechas'

export default function ModalReprogramar({ reserva, onCerrar, onGuardado }) {
  const [hoy] = useState(() => hoyISO())
  const [fecha, setFecha] = useState(reserva.fecha)
  const [hora, setHora] = useState(horaCorta(reserva.hora))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const valido = !!fecha && !!hora && fecha >= hoy
  const sinCambios = fecha === reserva.fecha && hora === horaCorta(reserva.hora)

  const guardar = () => {
    if (!valido || sinCambios) return
    setGuardando(true)
    setError(null)
    reservasService
      .actualizar(reserva.id, { fecha, hora: `${hora}:00` })
      .then((r) => {
        toast.exito('Reserva reprogramada')
        onGuardado(r)
      })
      .catch((e) => {
        setGuardando(false)
        setError(e.message)
      })
  }

  return (
    <Modal
      titulo="Reprogramar reserva"
      onCerrar={onCerrar}
      footer={
        <>
          <button type="button" className="btn-secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="button" className="btn-primario" disabled={!valido || sinCambios || guardando} onClick={guardar}>
            {guardando ? 'Guardando...' : 'Reprogramar'}
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-5 rounded-lg border-l-4 border-error bg-error/5 p-3 text-sm text-on-surface" role="alert">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="etiqueta" htmlFor="rp-fecha">
            Nueva fecha
          </label>
          <input
            id="rp-fecha"
            type="date"
            className="campo"
            min={hoy}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          {fecha && fecha < hoy && <p className="mensaje-campo">La fecha no puede ser pasada</p>}
        </div>
        <div>
          <label className="etiqueta" htmlFor="rp-hora">
            Nueva hora
          </label>
          <div className="relative">
            <select
              id="rp-hora"
              className="campo appearance-none pr-9 tabular-nums"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            >
              {HORARIOS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
              expand_more
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-on-surface-variant">Avísale al cliente el nuevo horario: la API no envía notificaciones.</p>
    </Modal>
  )
}
