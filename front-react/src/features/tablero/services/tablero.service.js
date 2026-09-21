import { ventasService } from '@/features/ventas/services/ventas.service'
import { bitacoraService } from '@/features/bitacora/services/bitacora.service'
import { reservasService } from '@/features/reservas/services/reservas.service'
import { stockService } from '@/features/inventario/services/stock.service'
import { rolesService } from '@/features/roles/services/roles.service'
import { sucursalesService } from '@/features/sucursales/services/sucursales.service'
import { usuariosService } from '@/core/services/usuarios.service'
import { cargarReferencias } from '@/core/stores/referencias.store'
import { sucursalDeVenta } from '@/features/ventas/ventas.utils'
import { esProxima } from '@/features/reservas/reservas.utils'
import { hoyISO } from '@/shared/utils/fechas'

let cache = null
let enCurso = null

export const tableroService = {
  cargar() {
    if (cache) return Promise.resolve(cache)
    if (enCurso) return enCurso

    enCurso = Promise.all([
      ventasService.listar().then((lista) => ventasService.obtenerVarias(lista.map((v) => v.id))),
      bitacoraService.listar().catch(() => []),
      reservasService.listar().then((lista) => reservasService.obtenerVarias(lista.map((r) => r.id))),
      stockService.listar(),
      usuariosService.listar(),
      rolesService.listar(),
      sucursalesService.listar(),
      cargarReferencias(),
    ])
      .then(([ventas, bitacora, reservas, stock, usuarios, roles, sucursales]) => {
        const fechas = new Map()
        for (const r of bitacora) {
          const m = r.accion.match(/^Venta #(\d+)/i)
          if (!m) continue
          const id = Number(m[1])
          if (!fechas.has(id) || r.fecha < fechas.get(id)) fechas.set(id, r.fecha)
        }
        cache = {
          ventas,
          fechas,
          bitacora,
          reservas,
          stock,
          usuarios,
          rolCliente: roles.find((r) => r.nombre === 'cliente')?.id ?? null,
          sucursales,
        }
        enCurso = null
        return cache
      })
      .catch((e) => {
        enCurso = null
        throw e
      })
    return enCurso
  },

  refrescar() {
    cache = null
    enCurso = null
    return this.cargar()
  },
}

export function periodosTablero(hoy = hoyISO()) {
  const mesActual = hoy.slice(0, 7)
  const [a, m] = mesActual.split('-').map(Number)
  const d = new Date(a, m - 2, 1)
  const mesAnterior = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return { hoy, mesActual, mesAnterior }
}

export function ventasFechadas(datos) {
  return datos.ventas.map((v) => {
    const comprobante = [...v.comprobantes].sort((a, b) => a.fecha.localeCompare(b.fecha))[0]?.fecha
    const fecha = comprobante ?? datos.fechas.get(v.id) ?? null
    return { venta: v, fecha: fecha ? fecha.slice(0, 10) : null, total: Number(v.total) }
  })
}

export function agregarTablero(datos) {
  const { hoy, mesActual, mesAnterior } = periodosTablero()
  const fechadas = ventasFechadas(datos)

  const actual = fechadas.filter((v) => v.fecha?.startsWith(mesActual)).reduce((a, v) => a + v.total, 0)
  const anterior = fechadas.filter((v) => v.fecha?.startsWith(mesAnterior)).reduce((a, v) => a + v.total, 0)
  const ventasDelMes = { valor: actual, variacion: anterior > 0 ? ((actual - anterior) / anterior) * 100 : null }

  const reservasPendientes = { valor: datos.reservas.filter((r) => esProxima(r, hoy)).length, variacion: null }

  const porProducto = new Map()
  for (const s of datos.stock) porProducto.set(s.producto_id, (porProducto.get(s.producto_id) ?? 0) + s.cantidad)
  const productosSinStock = { valor: [...porProducto.values()].filter((c) => c === 0).length, variacion: null }

  const clientes = { valor: datos.usuarios.filter((u) => u.rol_id === datos.rolCliente).length, variacion: null }

  const ventasPorDia = []
  const base = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i)
    ventasPorDia.push({
      fecha: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      total: 0,
    })
  }
  const indice = new Map(ventasPorDia.map((d, i) => [d.fecha, i]))
  for (const v of fechadas) {
    const i = v.fecha ? indice.get(v.fecha) : undefined
    if (i !== undefined) ventasPorDia[i].total += v.total
  }

  const totales = new Map()
  for (const v of datos.ventas) {
    const s = sucursalDeVenta(v)
    if (s) totales.set(s.id, (totales.get(s.id) ?? 0) + Number(v.total))
  }
  const facturacionPorSucursal = datos.sucursales.map((s) => ({ sucursal: s, total: totales.get(s.id) ?? 0 }))

  const acumulado = new Map()
  for (const v of datos.ventas) {
    for (const d of v.detalles) {
      const p = d.producto_sucursal?.producto
      if (!p) continue
      const item = acumulado.get(p.id) ?? {
        nombre: p.nombre,
        unidades: 0,
        monto: 0,
        producto_id: p.id,
        talla_id: p.talla_id,
        color_id: p.color_id,
      }
      item.unidades += d.cantidad
      item.monto += Number(d.precio) * d.cantidad
      acumulado.set(p.id, item)
    }
  }
  const productosMasVendidos = [...acumulado.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 5)

  const ultimosMovimientos = [...datos.bitacora].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8)

  const ventasSinFecha = fechadas.filter((v) => !v.fecha).length

  return {
    ventasDelMes,
    reservasPendientes,
    productosSinStock,
    clientes,
    ventasPorDia,
    facturacionPorSucursal,
    productosMasVendidos,
    ultimosMovimientos,
    ventasSinFecha,
  }
}
