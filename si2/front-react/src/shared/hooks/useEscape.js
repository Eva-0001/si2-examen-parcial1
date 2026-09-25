import { useEffect, useRef } from 'react'

export function useEscape(alPresionar) {
  const ref = useRef(alPresionar)

  useEffect(() => {
    ref.current = alPresionar
  })

  useEffect(() => {
    const manejar = (e) => {
      if (e.key === 'Escape') ref.current?.()
    }
    document.addEventListener('keydown', manejar)
    return () => document.removeEventListener('keydown', manejar)
  }, [])
}
