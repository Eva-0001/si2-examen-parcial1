import { http } from '@/core/api/http'

export const trabajadoresService = {
  listar(sucursalId) {
    const params = {}
    if (sucursalId !== undefined) params.sucursal_id = sucursalId
    return http.get('/trabajadores', { params })
  },

  obtener(id) {
    return http.get(`/trabajadores/${id}`)
  },

  crear(datos) {
    return http.post('/trabajadores', datos)
  },

  actualizar(id, datos) {
    return http.put(`/trabajadores/${id}`, datos)
  },

  eliminar(id) {
    return http.delete(`/trabajadores/${id}`)
  },
}
