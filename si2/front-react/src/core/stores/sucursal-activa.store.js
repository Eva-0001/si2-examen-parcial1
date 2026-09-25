import { create } from 'zustand'
import { http } from '../api/http'

const SUCURSAL_KEY = 'sucursal_activa'

export const useSucursalActivaStore = create((set, get) => ({
  ciudades: [],
  sucursales: [],
  sucursal: leerGuardada(),

  cargar() {
    http
      .get('/ciudades')
      .then((ciudades) => set({ ciudades }))
      .catch(() => {})

    http
      .get('/sucursales')
      .then((sucursales) => {
        set({ sucursales })

        const actual = get().sucursal
        const vigente = actual ? sucursales.find((s) => s.id === actual.id) : undefined
        if (vigente) {
          get().seleccionar(vigente)
        } else if (sucursales.length > 0) {
          get().seleccionar(sucursales[0])
        }
      })
      .catch(() => {})
  },

  seleccionar(sucursal) {
    set({ sucursal })
    localStorage.setItem(SUCURSAL_KEY, JSON.stringify(sucursal))
  },
}))

export function useSucursalActiva() {
  const estado = useSucursalActivaStore()
  const s = estado.sucursal
  const ciudad = s ? (estado.ciudades.find((c) => c.id === s.ciudad_id) ?? null) : null
  return { ...estado, ciudad }
}

function leerGuardada() {
  try {
    const raw = localStorage.getItem(SUCURSAL_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
