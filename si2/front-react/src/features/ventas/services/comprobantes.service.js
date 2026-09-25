import { http } from '@/core/api/http'

export const comprobantesService = {
  listar(ventaId) {
    const params = {}
    if (ventaId !== undefined) params.venta_id = ventaId
    return http.get('/comprobantes', { params })
  },

  obtener(id) {
    return http.get(`/comprobantes/${id}`)
  },

  emitir(datos) {
    return http.post('/comprobantes', datos)
  },

  actualizar(id, datos) {
    return http.put(`/comprobantes/${id}`, datos)
  },

  eliminar(id) {
    return http.delete(`/comprobantes/${id}`)
  },
}
