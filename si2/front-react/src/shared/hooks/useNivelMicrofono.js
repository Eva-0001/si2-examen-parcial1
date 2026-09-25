import { useEffect, useRef, useState } from 'react'

/**
 * Mientras `activo` es true abre el micrófono y mide su volumen (0 a 1), para mostrar si
 * realmente llega sonido. `resumen` guarda el pico de la última escucha y el micrófono usado.
 */
export function useNivelMicrofono(activo) {
  const [nivel, setNivel] = useState(0)
  const [dispositivo, setDispositivo] = useState('')
  const resumen = useRef({ pico: 0, dispositivo: '' })

  useEffect(() => {
    if (!activo || !navigator.mediaDevices?.getUserMedia) return

    let cancelado = false
    let flujo = null
    let contexto = null
    let cuadro = 0
    resumen.current = { pico: 0, dispositivo: '' }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        flujo = stream
        const nombre = stream.getAudioTracks()[0]?.label ?? ''
        resumen.current.dispositivo = nombre
        setDispositivo(nombre)

        contexto = new AudioContext()
        const analizador = contexto.createAnalyser()
        analizador.fftSize = 512
        contexto.createMediaStreamSource(stream).connect(analizador)
        const muestras = new Float32Array(analizador.fftSize)

        const medir = () => {
          analizador.getFloatTimeDomainData(muestras)
          let suma = 0
          for (const m of muestras) suma += m * m
          // RMS escalado: la voz normal queda cerca de 0.3–0.8.
          const valor = Math.min(1, Math.sqrt(suma / muestras.length) * 6)
          resumen.current.pico = Math.max(resumen.current.pico, valor)
          setNivel(valor)
          cuadro = requestAnimationFrame(medir)
        }
        medir()
      })
      .catch((e) => console.warn('[Reporte por voz] no se pudo medir el micrófono:', e))

    return () => {
      cancelado = true
      cancelAnimationFrame(cuadro)
      flujo?.getTracks().forEach((t) => t.stop())
      contexto?.close()
      setNivel(0)
    }
  }, [activo])

  return { nivel, dispositivo, resumen }
}
