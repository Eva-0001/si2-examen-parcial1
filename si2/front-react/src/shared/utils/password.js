export const MIN_PASSWORD = 8

export function nivelFuerza(password) {
  if (!password) return 0
  if (password.length < MIN_PASSWORD) return 1

  let puntos = 1
  if (password.length >= 12) puntos++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) puntos++
  if (/\d/.test(password)) puntos++
  if (/[^A-Za-z0-9]/.test(password)) puntos++

  return Math.min(4, puntos)
}

export const ETIQUETA_FUERZA = {
  0: '',
  1: 'Débil',
  2: 'Regular',
  3: 'Buena',
  4: 'Fuerte',
}
