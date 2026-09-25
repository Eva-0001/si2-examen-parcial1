import { useEffect, useRef, useState } from 'react'
import { cx } from '../utils/clases'
import { FORMATOS_IMAGEN, IMAGENES_ACEPTADAS, prepararImagen } from '../utils/imagenes'

const MAX_MB = 5

export default function CampoImagen({ urlActual = null, deshabilitado = false, onArchivo, onQuitarActual }) {
  const [arrastrando, setArrastrando] = useState(false)
  const [error, setError] = useState(null)
  const [urlLocal, setUrlLocal] = useState(null)
  const [actualQuitada, setActualQuitada] = useState(false)

  const urlLocalRef = useRef(null)
  useEffect(() => () => urlLocalRef.current && URL.revokeObjectURL(urlLocalRef.current), [])

  const esNueva = urlLocal !== null
  const previsualizacion = urlLocal ?? (actualQuitada ? null : urlActual)

  const liberarUrlLocal = () => {
    if (urlLocalRef.current) URL.revokeObjectURL(urlLocalRef.current)
    urlLocalRef.current = null
    setUrlLocal(null)
  }

  const procesar = (elegido) => {
    setError(null)
    if (!elegido) return

    const archivo = prepararImagen(elegido)
    if (!archivo) {
      setError(`Formato no permitido. Usa ${FORMATOS_IMAGEN}.`)
      return
    }
    if (archivo.size > MAX_MB * 1024 * 1024) {
      setError(`La imagen supera los ${MAX_MB} MB.`)
      return
    }

    liberarUrlLocal()
    const url = URL.createObjectURL(archivo)
    urlLocalRef.current = url
    setUrlLocal(url)
    onArchivo?.(archivo)
  }

  const alElegir = (evento) => {
    const entrada = evento.target
    procesar(entrada.files?.[0] ?? null)
    entrada.value = ''
  }

  const alArrastrar = (evento, entrando) => {
    evento.preventDefault()
    if (!deshabilitado) setArrastrando(entrando)
  }

  const alSoltar = (evento) => {
    evento.preventDefault()
    setArrastrando(false)
    if (deshabilitado) return
    procesar(evento.dataTransfer?.files?.[0] ?? null)
  }

  const quitar = () => {
    if (urlLocal) {
      liberarUrlLocal()
      onArchivo?.(null)
      return
    }
    setActualQuitada(true)
    onQuitarActual?.()
  }

  return (
    <>
      {previsualizacion ? (
        <div className="relative h-48 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
          <img src={previsualizacion} alt="Vista previa" className="h-full w-full object-cover" />
          {!deshabilitado && (
            <button
              type="button"
              className="absolute right-2 top-2 flex rounded-full bg-surface-container-lowest/90 p-1.5 text-error shadow-card transition-colors hover:bg-error hover:text-on-primary"
              title="Quitar imagen"
              onClick={quitar}
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          {esNueva && (
            <span className="absolute bottom-2 left-2 rounded-full bg-surface-container-lowest/90 px-2 py-0.5 text-[11px] font-semibold text-primary">
              Nueva, se sube al guardar
            </span>
          )}
        </div>
      ) : (
        <label
          className={cx(
            'flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 text-center transition-colors',
            arrastrando ? 'border-primary bg-surface-container' : 'border-outline-variant bg-surface hover:bg-surface-container-low',
          )}
          onDragOver={(e) => alArrastrar(e, true)}
          onDragLeave={(e) => alArrastrar(e, false)}
          onDrop={alSoltar}
        >
          <span className="material-symbols-outlined mb-2 text-[36px] text-on-surface-variant">add_photo_alternate</span>
          <p className="text-sm text-on-surface">
            <span className="font-semibold text-primary">Arrastra una imagen</span> o haz clic
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">{`${FORMATOS_IMAGEN}. Máximo ${MAX_MB} MB`}</p>
          <input type="file" className="hidden" accept={IMAGENES_ACEPTADAS} disabled={deshabilitado} onChange={alElegir} />
        </label>
      )}
      {error && <p className="mensaje-campo">{error}</p>}
    </>
  )
}
