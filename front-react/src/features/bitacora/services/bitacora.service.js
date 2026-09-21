import { http } from '@/core/api/http'

export const bitacoraService = {
  listar(filtros = {}) {
    const params = {}
    if (filtros.encargado) params.encargado = filtros.encargado
    if (filtros.desde) params.desde = filtros.desde
    if (filtros.hasta) params.hasta = filtros.hasta
    return http.get('/bitacora', { params })
  },

  fechasDeVentas() {
    return this.listar().then((registros) => {
      const fechas = new Map()
      for (const r of registros) {
        const m = r.accion.match(/^Venta #(\d+)/i)
        if (!m) continue
        const id = Number(m[1])
        const actual = fechas.get(id)
        if (!actual || r.fecha < actual) fechas.set(id, r.fecha)
      }
      return fechas
    })
  },
}
