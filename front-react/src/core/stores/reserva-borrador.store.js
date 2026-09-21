import { useMemo } from 'react'
import { create } from 'zustand'
import { accionesItems, leerItems, persistirItems, resumenItems } from './lista-items'

const BORRADOR_KEY = 'reserva_borrador'

export const useReservaBorradorStore = create((set, get) => ({
  items: leerItems(BORRADOR_KEY),
  ...accionesItems(set, get),
}))

persistirItems(useReservaBorradorStore, BORRADOR_KEY)

export function useReservaBorrador() {
  const estado = useReservaBorradorStore()
  const resumen = useMemo(() => resumenItems(estado.items), [estado.items])
  return {
    ...estado,
    cantidadTotal: resumen.cantidadTotal,
    sucursales: resumen.sucursales,
    mezclado: resumen.mezclado,
    sucursal: resumen.sucursal,
  }
}
