import { http } from '@/core/api/http'

export const ventasService = {
  listar(filtros = {}) {
    const params = {}
    if (filtros.usuario_id !== undefined) params.usuario_id = filtros.usuario_id
    if (filtros.tipo_venta) params.tipo_venta = filtros.tipo_venta
    return http.get('/ventas', { params })
  },

  obtener(id) {
    return http.get(`/ventas/${id}`)
  },

  obtenerVarias(ids) {
    if (ids.length === 0) return Promise.resolve([])
    return Promise.all(ids.map((id) => this.obtener(id)))
  },

  crear(datos) {
    return http.post('/ventas', datos)
  },

  corregirTipo(id, tipo_venta) {
    return http.put(`/ventas/${id}`, { tipo_venta })
  },

  anular(id) {
    return http.delete(`/ventas/${id}`).then(() => undefined)
  },
}
