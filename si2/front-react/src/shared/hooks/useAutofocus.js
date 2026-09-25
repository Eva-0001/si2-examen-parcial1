import { useCallback } from 'react'

export function useAutofocus(seleccionar = false) {
  return useCallback(
    (el) => {
      if (!el) return
      queueMicrotask(() => {
        el.focus()
        if (seleccionar && typeof el.select === 'function') el.select()
      })
    },
    [seleccionar],
  )
}
