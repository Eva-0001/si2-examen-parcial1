export function cx(...partes) {
  const salida = []
  for (const p of partes) {
    if (!p) continue
    if (typeof p === 'string') salida.push(p)
    else if (typeof p === 'object') {
      for (const [clase, activa] of Object.entries(p)) if (activa) salida.push(clase)
    }
  }
  return salida.join(' ')
}
