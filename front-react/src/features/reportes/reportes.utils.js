import { periodosTablero, ventasFechadas } from '@/features/tablero/services/tablero.service'
import { sucursalDeVenta } from '@/features/ventas/ventas.utils'
import { estadoReserva, horaCorta, sucursalDeReserva } from '@/features/reservas/reservas.utils'
import { desdeISO } from '@/shared/utils/fechas'



export const EJEMPLOS = [
  { tipo: 'ventas-sucursal', texto: 'Ventas del mes por sucursal', patron: /venta|factur|sucursal/i },
  { tipo: 'sin-stock', texto: 'Productos sin stock', patron: /stock|agotad|inventario|faltan/i },
  { tipo: 'reservas-semana', texto: 'Reservas de esta semana', patron: /reserva|semana|vestidor/i },
]

const formatoBs = (v) => `Bs ${Math.round(v)}`
const formatoEntero = (v) => String(v)

export const EJEMPLOS_IA = [
  'Ventas de este mes por sucursal',
  'Las 5 prendas más vendidas del mes',
  'Prendas sin stock',
  'Reservas de esta semana',
]

export const EJEMPLOS_IA_SUCURSAL = [
  'Ventas de este mes día por día',
  'Las 5 prendas más vendidas del mes',
  'Prendas sin stock',
  'Reservas de esta semana',
]

const ETIQUETAS = {
  Dia: 'Día',
  Categoria: 'Categoría',
  'Ventas por dia': 'Ventas por día',
  'Prendas mas vendidas': 'Prendas más vendidas',
  asistio: 'Asistió',
  'no asistio': 'No asistió',
  pendiente: 'Pendiente',
}
const conTildes = (texto) => ETIQUETAS[texto] ?? texto


export function reporteDesdeIa(r) {
  return {
    tipo: (r.tipo),
    titulo: conTildes(r.titulo),
    subtitulo: r.subtitulo,
    grafico: r.grafico,
    serie: r.serie,
    formato: r.formato === 'bs' ? formatoBs : formatoEntero,
    encabezados: r.tabla.encabezados.map(conTildes),
    filas: r.tabla.filas.map((fila) => fila.map((c) => (typeof c === 'string' ? conTildes(c) : c))),
    resumen: r.resumen,
    hallazgos: r.hallazgos,
    recomendaciones: r.recomendaciones,
  }
}

export function armarReporte(tipo, datos, nombre) {
  const { hoy, mesActual } = periodosTablero()

  switch (tipo) {
    case 'ventas-sucursal': {
      const porSucursal = new Map()
      for (const s of datos.sucursales) porSucursal.set(s.nombre, { ventas: 0, total: 0 })
      for (const v of ventasFechadas(datos)) {
        if (!v.fecha?.startsWith(mesActual)) continue
        const s = sucursalDeVenta(v.venta)?.nombre ?? 'Sin sucursal'
        const acc = porSucursal.get(s) ?? { ventas: 0, total: 0 }
        acc.ventas++
        acc.total += v.total
        porSucursal.set(s, acc)
      }
      const filas = [...porSucursal.entries()]
        .map(([s, d]) => [s, d.ventas, d.total.toFixed(2)])
        .sort((a, b) => Number(b[2]) - Number(a[2]))
      return {
        tipo,
        titulo: 'Ventas del mes por sucursal',
        subtitulo: `Mes ${mesActual}. Solo ventas con fecha conocida.`,
        serie: filas.map((f) => ({ etiqueta: String(f[0]), detalle: `${f[1]} ventas`, valor: Number(f[2]) })),
        formato: formatoBs,
        encabezados: ['Sucursal', 'Ventas', 'Total (Bs)'],
        filas,
      }
    }
    case 'sin-stock': {
      const agotados = datos.stock.filter((s) => s.cantidad === 0)
      const porSucursal = new Map()
      const filas = agotados.map((s) => {
        const nombreSucursal = s.sucursal?.nombre ?? `Sucursal ${s.sucursal_id}`
        porSucursal.set(nombreSucursal, (porSucursal.get(nombreSucursal) ?? 0) + 1)
        return [
          s.producto?.nombre ?? `Producto ${s.producto_id}`,
          nombre('tallas', s.producto?.talla_id) ?? '',
          nombre('colores', s.producto?.color_id) ?? '',
          nombreSucursal,
          Number(s.precio).toFixed(2),
        ]
      })
      return {
        tipo,
        titulo: 'Productos sin stock',
        subtitulo: `${agotados.length} combinaciones producto-sucursal agotadas`,
        serie: [...porSucursal.entries()].map(([s, n]) => ({ etiqueta: s, valor: n })),
        formato: formatoEntero,
        encabezados: ['Producto', 'Talla', 'Color', 'Sucursal', 'Precio (Bs)'],
        filas,
      }
    }
    case 'reservas-semana': {
      const fechaHoy = desdeISO(hoy)
      const lunes = new Date(fechaHoy)
      lunes.setDate(fechaHoy.getDate() - ((fechaHoy.getDay() + 6) % 7))
      const domingo = new Date(lunes)
      domingo.setDate(lunes.getDate() + 6)
      const iso = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const desde = iso(lunes)
      const hasta = iso(domingo)
      const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
      const porDia = new Map(dias.map((d) => [d, 0]))
      const reservas = datos.reservas
        .filter((r) => r.fecha >= desde && r.fecha <= hasta)
        .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))
      const filas = reservas.map((r) => {
        const d = dias[(desdeISO(r.fecha).getDay() + 6) % 7]
        porDia.set(d, (porDia.get(d) ?? 0) + 1)
        const estado = estadoReserva(r)
        return [
          r.fecha,
          horaCorta(r.hora),
          r.usuario ? `${r.usuario.nombre} ${r.usuario.apellido}` : `Usuario ${r.usuario_id}`,
          sucursalDeReserva(r)?.nombre ?? '',
          r.detalles.reduce((a, d2) => a + d2.cantidad, 0),
          estado === 'asistio' ? 'Asistió' : estado === 'vencida' ? 'No asistió' : 'Pendiente',
        ]
      })
      return {
        tipo,
        titulo: 'Reservas de esta semana',
        subtitulo: `Del ${desde} al ${hasta}`,
        serie: dias.map((d) => ({ etiqueta: d, valor: porDia.get(d) ?? 0 })),
        formato: formatoEntero,
        encabezados: ['Fecha', 'Hora', 'Cliente', 'Sucursal', 'Prendas', 'Estado'],
        filas,
      }
    }
  }
  return null
}
