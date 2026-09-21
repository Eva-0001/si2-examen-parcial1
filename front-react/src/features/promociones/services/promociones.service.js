import { http } from '@/core/api/http'
import { env } from '@/config/env'

export const promocionesService = {
  listar(filtros = {}) {
    const params = {}
    if (filtros.sucursal_id !== undefined) params.sucursal_id = filtros.sucursal_id
    if (filtros.solo_vigentes) params.solo_vigentes = 'true'
    return http.get('/promociones', { params })
  },

  obtener(id) {
    return http.get(`/promociones/${id}`)
  },

  crear(datos) {
    return http.post('/promociones', datos)
  },

  actualizar(id, datos) {
    return http.put(`/promociones/${id}`, datos)
  },

  subirFoto(id, archivo) {
    const form = new FormData()
    form.append('archivo', archivo)
    return http.post(`/promociones/${id}/foto`, form)
  },

  quitarFoto(id) {
    return http.delete(`/promociones/${id}/foto`)
  },

  eliminar(id) {
    return http.delete(`/promociones/${id}`)
  },

  urlFoto(promocion) {
    return promocion.foto ? `${env.apiUrl}${promocion.foto}` : null
  },
}
