import { http } from '@/core/api/http'

export const proveedoresService = {
  listar(nombre) {
    const params = {}
    if (nombre) params.nombre = nombre
    return http.get('/proveedores', { params })
  },

  obtener(id) {
    return http.get(`/proveedores/${id}`)
  },

  crear(datos) {
    return http.post('/proveedores', datos)
  },

  actualizar(id, datos) {
    return http.put(`/proveedores/${id}`, datos)
  },

  eliminar(id) {
    return http.delete(`/proveedores/${id}`)
  },
}
