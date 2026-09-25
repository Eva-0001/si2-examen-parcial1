import { http } from '@/core/api/http'

export const ciudadesService = {
  listar() {
    return http.get('/ciudades')
  },

  obtener(id) {
    return http.get(`/ciudades/${id}`)
  },

  crear(datos) {
    return http.post('/ciudades', datos)
  },

  actualizar(id, datos) {
    return http.put(`/ciudades/${id}`, datos)
  },

  eliminar(id) {
    return http.delete(`/ciudades/${id}`)
  },
}
