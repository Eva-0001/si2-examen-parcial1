import { http } from '@/core/api/http'

export const catalogosService = {
  listar(recurso) {
    return http.get(`/${recurso}`)
  },

  obtener(recurso, id) {
    return http.get(`/${recurso}/${id}`)
  },

  crear(recurso, datos) {
    return http.post(`/${recurso}`, datos)
  },

  actualizar(recurso, id, datos) {
    return http.put(`/${recurso}/${id}`, datos)
  },

  eliminar(recurso, id) {
    return http.delete(`/${recurso}/${id}`)
  },
}
