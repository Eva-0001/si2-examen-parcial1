export function nivelStock(cantidad) {
  if (cantidad <= 0) return 'agotado'
  if (cantidad <= 10) return 'bajo'
  return 'alto'
}
