import { hoyISO } from '@/shared/utils/fechas'

export const HORARIOS = (() => {
  const salida = []
  for (let h = 10; h < 20; h++) {
    salida.push(`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`)
  }
  salida.push('20:00')
  return salida
})()

export function horaCorta(hora) {
  return hora.slice(0, 5)
}

export function ahoraHHmm() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function estadoReserva(r, hoy = hoyISO(), ahora = ahoraHHmm()) {
  if (r.asistencia) return 'asistio'
  if (r.fecha < hoy || (r.fecha === hoy && horaCorta(r.hora) < ahora)) return 'vencida'
  return 'pendiente'
}

export function esProxima(r, hoy = hoyISO()) {
  return !r.asistencia && r.fecha >= hoy
}

export function sucursalDeReserva(r) {
  return r.detalles.find((d) => d.producto_sucursal?.sucursal)?.producto_sucursal?.sucursal ?? null
}

export function unidadesDeReserva(r) {
  return r.detalles.reduce((acc, d) => acc + d.cantidad, 0)
}

export const ETIQUETA_ESTADO = {
  pendiente: 'Pendiente de asistencia',
  asistio: 'Asististe',
  vencida: 'No asistió',
}

export const CHIP_ESTADO = {
  pendiente: 'bg-warning/10 text-warning',
  asistio: 'bg-success/10 text-success',
  vencida: 'bg-surface-container-low text-on-surface-variant',
}

export function numeroReserva(id) {
  return `R-${String(id).padStart(5, '0')}`
}
