export function crearReconocimiento() {
  const Ctor = constructorReconocimiento()
  if (!Ctor) return null
  const r = new Ctor()
  r.lang = 'es-BO'
  r.interimResults = false
  r.maxAlternatives = 1
  return r
}

const ERRORES_DE_VOZ = {
  'not-allowed': 'El navegador bloqueó el micrófono. Dale permiso desde el candado de la barra de direcciones.',
  'service-not-allowed': 'El navegador no permite el reconocimiento de voz en esta página.',
  'audio-capture': 'No se encontró un micrófono. Revisa que esté conectado y seleccionado en Windows.',
  network: 'El reconocimiento de voz necesita internet (usa el servicio de Google). Si usas Brave, no lo soporta: prueba con Chrome o Edge.',
  'no-speech': 'No escuché nada. Habla apenas se active el micrófono.',
  'language-not-supported': 'Tu navegador no reconoce voz en español de Bolivia.',
}

/** Mensaje entendible para un error del reconocimiento de voz, o null si no hace falta avisar. */
export function mensajeErrorDeVoz(error) {
  if (error === 'aborted') return null
  return ERRORES_DE_VOZ[error] ?? `No pudimos escucharte (${error}). Prueba de nuevo o escribe la pregunta.`
}

/** Por qué no se puede dictar en esta página, o null si se puede. */
export function motivoSinVoz() {
  if (typeof window === 'undefined') return 'Sin navegador.'
  if (!window.isSecureContext) {
    return 'El micrófono solo funciona en https o en http://localhost. Abre la página desde localhost en vez de la IP.'
  }
  if (!constructorReconocimiento()) {
    return 'Tu navegador no tiene reconocimiento de voz (Firefox no lo soporta). Usa Chrome o Edge, o escribe la pregunta.'
  }
  return null
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
