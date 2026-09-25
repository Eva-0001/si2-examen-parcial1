import { create } from 'zustand'

const DURACION_MS = 4500

let contador = 0

export const useToastStore = create((set, get) => ({
  toasts: [],

  agregar(tipo, mensaje) {
    const toast = { id: ++contador, tipo, mensaje }
    set({ toasts: [...get().toasts, toast] })
    setTimeout(() => get().cerrar(toast.id), DURACION_MS)
  },

  cerrar(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },
}))

export const toast = {
  exito: (mensaje) => useToastStore.getState().agregar('exito', mensaje),
  error: (mensaje) => useToastStore.getState().agregar('error', mensaje),
  advertencia: (mensaje) => useToastStore.getState().agregar('advertencia', mensaje),
  info: (mensaje) => useToastStore.getState().agregar('info', mensaje),
  cerrar: (id) => useToastStore.getState().cerrar(id),
}
