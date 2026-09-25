import { useCallback } from 'react'
import { create } from 'zustand'
import { catalogosService } from '@/features/catalogos/services/catalogos.service'
import { RECURSOS_CATALOGO } from '../models/catalogo.model'

const VACIO = { categorias: [], colecciones: [], colores: [], tallas: [], temporadas: [] }

function armarMapas(datos) {
  const salida = {}
  for (const r of RECURSOS_CATALOGO) salida[r] = new Map(datos[r].map((i) => [i.id, i.nombre]))
  return salida
}

let cargado = false
let enCurso = null

export const useReferenciasStore = create((set) => ({
  datos: VACIO,
  mapas: armarMapas(VACIO),

  cargar() {
    if (cargado) return Promise.resolve()
    if (enCurso) return enCurso

    enCurso = Promise.all(RECURSOS_CATALOGO.map((r) => catalogosService.listar(r)))
      .then((listas) => {
        const datos = Object.fromEntries(RECURSOS_CATALOGO.map((r, i) => [r, listas[i]]))
        set({ datos, mapas: armarMapas(datos) })
        cargado = true
        enCurso = null
      })
      .catch((e) => {
        enCurso = null
        throw e
      })
    return enCurso
  },

  invalidar() {
    cargado = false
    enCurso = null
  },
}))

export function cargarReferencias() {
  return useReferenciasStore.getState().cargar()
}

export function listaReferencia(recurso) {
  return useReferenciasStore.getState().datos[recurso]
}

export function nombreReferencia(recurso, id) {
  if (id === null || id === undefined) return null
  return useReferenciasStore.getState().mapas[recurso].get(id) ?? null
}

export function useReferencias() {
  const datos = useReferenciasStore((s) => s.datos)
  const mapas = useReferenciasStore((s) => s.mapas)
  const cargar = useReferenciasStore((s) => s.cargar)
  const invalidar = useReferenciasStore((s) => s.invalidar)

  const lista = useCallback((recurso) => datos[recurso], [datos])
  const nombre = useCallback(
    (recurso, id) => (id === null || id === undefined ? null : (mapas[recurso].get(id) ?? null)),
    [mapas],
  )

  return { lista, nombre, cargar, invalidar }
}
