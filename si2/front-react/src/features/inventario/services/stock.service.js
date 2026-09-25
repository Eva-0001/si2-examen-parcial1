import { http } from '@/core/api/http'

export const stockService = {
  listar(filtros = {}) {
    const params = {}
    if (filtros.producto_id !== undefined) params.producto_id = filtros.producto_id
    if (filtros.sucursal_id !== undefined) params.sucursal_id = filtros.sucursal_id
    if (filtros.solo_disponibles) params.solo_disponibles = 'true'
    return http.get('/stock', { params })
  },

  obtener(id) {
    return http.get(`/stock/${id}`)
  },

  crear(datos) {
    return http.post('/stock', datos)
  },

  actualizar(id, datos) {
    return http.put(`/stock/${id}`, datos)
  },

  eliminar(id) {
    return http.delete(`/stock/${id}`)
  },
}
