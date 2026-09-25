import { create } from 'zustand'
import { productosService } from '@/features/productos/services/productos.service'
import { stockService } from '@/features/inventario/services/stock.service'
import { useReferenciasStore } from '@/core/stores/referencias.store'
import { useSucursalActivaStore } from '@/core/stores/sucursal-activa.store'

export function claveDe(nombre) {
  return nombre.trim().toLowerCase().replace(/\s+/g, ' ')
}

export const useCatalogoStore = create(() => ({
  productos: [],
  stock: [],
}))

let cargado = false
let enCurso = null

export const catalogoService = {
  estaCargado() {
    return cargado
  },

  cargar() {
    if (cargado) return Promise.resolve()
    if (enCurso) return enCurso

    enCurso = Promise.all([
      productosService.listar(),
      stockService.listar(),
      useReferenciasStore.getState().cargar(),
    ])
      .then(([productos, stock]) => {
        useCatalogoStore.setState({ productos, stock })
        cargado = true
        enCurso = null
      })
      .catch((e) => {
        enCurso = null
        throw e
      })
    return enCurso
  },

  refrescar() {
    cargado = false
    enCurso = null
    return this.cargar()
  },

  urlFoto(producto) {
    return productosService.urlFoto(producto)
  },
}

let ultimoStock = null
let ultimoPorProducto = new Map()

function stockPorProductoDe(stock) {
  if (stock === ultimoStock) return ultimoPorProducto
  const m = new Map()
  for (const s of stock) {
    const lista = m.get(s.producto_id)
    if (lista) lista.push(s)
    else m.set(s.producto_id, [s])
  }
  ultimoStock = stock
  ultimoPorProducto = m
  return m
}

let ultimasEntradas = null
let ultimosGrupos = []

function gruposDe(productos, stock, sucursalId) {
  const e = ultimasEntradas
  if (e && e.productos === productos && e.stock === stock && e.sucursalId === sucursalId) return ultimosGrupos

  const porProducto = stockPorProductoDe(stock)
  const porClave = new Map()
  for (const p of productos) {
    const clave = claveDe(p.nombre)
    const lista = porClave.get(clave)
    if (lista) lista.push(p)
    else porClave.set(clave, [p])
  }
  ultimosGrupos = [...porClave.entries()].map(([clave, variantes]) => armarGrupo(clave, variantes, sucursalId, porProducto))
  ultimasEntradas = { productos, stock, sucursalId }
  return ultimosGrupos
}

function armarGrupo(clave, variantes, sucursalId, porProducto) {
  const ordenadas = [...variantes].sort((a, b) => a.id - b.id)
  const conFoto = ordenadas.find((v) => v.foto)
  const rep = conFoto ?? ordenadas[0]

  let precioSucursal = null
  let precioGlobal = null
  let stockSucursal = 0
  let stockOtras = 0

  for (const v of ordenadas) {
    for (const s of porProducto.get(v.id) ?? []) {
      const precio = Number(s.precio)
      if (s.cantidad > 0) {
        precioGlobal = precioGlobal === null ? precio : Math.min(precioGlobal, precio)
      }
      if (s.sucursal_id === sucursalId) {
        stockSucursal += s.cantidad
        if (s.cantidad > 0) precioSucursal = precioSucursal === null ? precio : Math.min(precioSucursal, precio)
      } else {
        stockOtras += s.cantidad
      }
    }
  }

  const disponibilidad = stockSucursal > 0 ? 'disponible' : stockOtras > 0 ? 'otras' : 'agotado'

  return {
    clave,
    nombre: rep.nombre,
    id: rep.id,
    variantes: ordenadas,
    foto: productosService.urlFoto(rep),
    categoria_id: rep.categoria_id ?? null,
    coleccion_id: rep.coleccion_id,
    temporada_id: rep.temporada_id,
    colores: [...new Set(ordenadas.map((v) => v.color_id).filter((x) => x != null))],
    tallas: [...new Set(ordenadas.map((v) => v.talla_id).filter((x) => x != null))],
    precioDesde: precioSucursal ?? precioGlobal ?? (ordenadas.length ? Number(rep.precio) : null),
    disponibilidad,
    stockSucursal,
    maxId: Math.max(...ordenadas.map((v) => v.id)),
  }
}

function vistaCatalogo(productos, stock, sucursalId) {
  const grupos = gruposDe(productos, stock, sucursalId)
  const stockPorProducto = stockPorProductoDe(stock)
  return {
    productos,
    stock,
    grupos,
    stockPorProducto,
    grupoPorId: (id) => grupos.find((g) => g.variantes.some((v) => v.id === id)),
    stockDe: (productoId, sucId) => {
      if (sucId === null || sucId === undefined) return undefined
      return stockPorProducto.get(productoId)?.find((s) => s.sucursal_id === sucId)
    },
    urlFoto: (producto) => productosService.urlFoto(producto),
  }
}

export function useCatalogo() {
  const productos = useCatalogoStore((s) => s.productos)
  const stock = useCatalogoStore((s) => s.stock)
  const sucursalId = useSucursalActivaStore((s) => s.sucursal?.id ?? null)
  return vistaCatalogo(productos, stock, sucursalId)
}

export function catalogoActual() {
  const { productos, stock } = useCatalogoStore.getState()
  return vistaCatalogo(productos, stock, useSucursalActivaStore.getState().sucursal?.id ?? null)
}
