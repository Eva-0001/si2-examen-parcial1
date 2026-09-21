import { http, limpiarParams } from '@/core/api/http'
import { env } from '@/config/env'

export const productosService = {
  listar(filtros = {}) {
    return http.get('/productos', { params: limpiarParams(filtros) })
  },

  obtener(id) {
    return http.get(`/productos/${id}`)
  },

  crear(datos) {
    return http.post('/productos', datos)
  },

  actualizar(id, datos) {
    return http.put(`/productos/${id}`, datos)
  },

  subirFoto(id, archivo) {
    const form = new FormData()
    form.append('archivo', archivo)
    return http.post(`/productos/${id}/foto`, form)
  },

  quitarFoto(id) {
    return http.delete(`/productos/${id}/foto`)
  },

  eliminar(id) {
    return http.delete(`/productos/${id}`)
  },

  urlFoto(producto) {
    return producto.foto ? `${env.apiUrl}${producto.foto}` : null
  },
}
