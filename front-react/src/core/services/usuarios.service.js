import { http, limpiarParams } from '../api/http'

export const usuariosService = {
  listar(filtros = {}) {
    return http.get('/usuarios', { params: limpiarParams(filtros) })
  },

  obtener(id) {
    return http.get(`/usuarios/${id}`)
  },

  crear(datos) {
    return http.post('/usuarios', datos)
  },

  actualizar(id, datos) {
    return http.put(`/usuarios/${id}`, datos)
  },

  cambiarPassword(id, datos) {
    return http.patch(`/usuarios/${id}/password`, datos)
  },

  eliminar(id) {
    return http.delete(`/usuarios/${id}`)
  },
}
