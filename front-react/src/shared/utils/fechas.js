const MS_DIA = 86_400_000

export function hoyISO() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function desdeISO(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export function diasEntre(desde, hasta) {
  return Math.round((desdeISO(hasta).getTime() - desdeISO(desde).getTime()) / MS_DIA)
}

export function vigenciaDe(fechaInicio, fechaFinal, hoy = hoyISO()) {
  const duracion = Math.max(1, diasEntre(fechaInicio, fechaFinal) + 1)

  if (hoy < fechaInicio) {
    return { estado: 'proxima', diasRestantes: diasEntre(hoy, fechaInicio), porcentaje: 0, duracion }
  }
  if (hoy > fechaFinal) {
    return { estado: 'vencida', diasRestantes: 0, porcentaje: 100, duracion }
  }
  const transcurridos = diasEntre(fechaInicio, hoy)
  return {
    estado: 'vigente',
    diasRestantes: diasEntre(hoy, fechaFinal),
    porcentaje: Math.min(100, Math.round((transcurridos / duracion) * 100)),
    duracion,
  }
}
