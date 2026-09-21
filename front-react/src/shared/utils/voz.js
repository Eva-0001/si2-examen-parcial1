export function crearReconocimiento() {
  const Ctor = constructorReconocimiento()
  if (!Ctor) return null
  const r = new Ctor()
  r.lang = 'es-BO'
  r.interimResults = false
  r.maxAlternatives = 1
  return r
}

export function hayReconocimientoDeVoz() {
  return constructorReconocimiento() !== null
}

function constructorReconocimiento() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function descargarCsv(nombre, encabezados, filas) {
  if (typeof document === 'undefined') return
  const escapar = (v) => `"${String(v).replace(/"/g, '""')}"`
  const contenido = [encabezados, ...filas].map((f) => f.map(escapar).join(';')).join('\r\n')
  const blob = new Blob([`\uFEFF${contenido}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}
