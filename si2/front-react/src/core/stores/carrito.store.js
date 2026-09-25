import { useMemo } from 'react'
import { create } from 'zustand'
import { accionesItems, leerItems, persistirItems, resumenItems } from './lista-items'

const CARRITO_KEY = 'carrito'

export const useCarritoStore = create((set, get) => ({
  items: leerItems(CARRITO_KEY),
  abierto: false,

  ...accionesItems(set, get),

  abrir() {
    set({ abierto: true })
  },

  cerrar() {
    set({ abierto: false })
  },
}))

persistirItems(useCarritoStore, CARRITO_KEY)

export function useCarrito() {
  const estado = useCarritoStore()
  const resumen = useMemo(() => resumenItems(estado.items), [estado.items])
  return { ...estado, ...resumen, total: resumen.subtotal }
}
