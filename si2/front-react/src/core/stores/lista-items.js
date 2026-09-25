export function leerItems(clave) {
  try {
    const raw = localStorage.getItem(clave)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function persistirItems(store, clave) {
  store.subscribe((estado, previo) => {
    if (estado.items !== previo.items) localStorage.setItem(clave, JSON.stringify(estado.items))
  })
}

export function accionesItems(set, get) {
  return {
    agregar(item, cantidad = 1) {
      const lista = get().items
      const existente = lista.find((i) => i.producto_sucursal_id === item.producto_sucursal_id)
      if (existente) {
        const final = Math.min(existente.cantidad + cantidad, item.maximo)
        set({
          items: lista.map((i) =>
            i.producto_sucursal_id === item.producto_sucursal_id ? { ...i, ...item, cantidad: final } : i,
          ),
        })
        return final
      }
      const final = Math.min(cantidad, item.maximo)
      set({ items: [...lista, { ...item, cantidad: final }] })
      return final
    },

    cambiarCantidad(productoSucursalId, cantidad) {
      set({
        items: get()
          .items.map((i) =>
            i.producto_sucursal_id === productoSucursalId
              ? { ...i, cantidad: Math.min(Math.max(0, cantidad), i.maximo) }
              : i,
          )
          .filter((i) => i.cantidad > 0),
      })
    },

    quitar(productoSucursalId) {
      set({ items: get().items.filter((i) => i.producto_sucursal_id !== productoSucursalId) })
    },

    conservarSucursal(sucursalId) {
      set({ items: get().items.filter((i) => i.sucursal_id === sucursalId) })
    },

    vaciar() {
      set({ items: [] })
    },
  }
}

export function resumenItems(items) {
  const cantidadTotal = items.reduce((acc, i) => acc + i.cantidad, 0)
  const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  const vistas = new Map()
  for (const i of items) vistas.set(i.sucursal_id, i.sucursal)
  const sucursales = [...vistas.entries()].map(([id, nombre]) => ({ id, nombre }))

  return {
    cantidadTotal,
    subtotal,
    sucursales,
    mezclado: sucursales.length > 1,
    sucursal: sucursales.length === 1 ? sucursales[0] : null,
  }
}
