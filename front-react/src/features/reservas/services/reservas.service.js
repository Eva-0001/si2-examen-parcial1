import { http } from '@/core/api/http'

export const reservasService = {
  listar(filtros = {}) {
    const params = {}
    if (filtros.usuario_id !== undefined) params.usuario_id = filtros.usuario_id
    if (filtros.asistencia !== undefined) params.asistencia = String(filtros.asistencia)
    return http.get('/reservas', { params })
  },

  obtener(id) {
    return http.get(`/reservas/${id}`)
  },

  obtenerVarias(ids) {
    if (ids.length === 0) return Promise.resolve([])
    return Promise.all(ids.map((id) => this.obtener(id)))
  },

  crear(datos) {
    return http.post('/reservas', datos)
  },

  actualizar(id, datos) {
    return http.patch(`/reservas/${id}`, datos)
  },

  cancelar(id) {
    return http.delete(`/reservas/${id}`)
  },
}
