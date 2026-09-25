import { http } from '@/core/api/http'

export const rolesService = {
  listar() {
    return http.get('/roles')
  },

  crear(datos) {
    return http.post('/roles', datos)
  },

  actualizar(id, datos) {
    return http.put(`/roles/${id}`, datos)
  },

  eliminar(id) {
    return http.delete(`/roles/${id}`)
  },
}
