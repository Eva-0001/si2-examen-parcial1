import { http } from '@/core/api/http'
import { env } from '@/config/env'

export const sucursalesService = {
  listar(ciudadId) {
    const params = {}
    if (ciudadId !== undefined) params.ciudad_id = ciudadId
    return http.get('/sucursales', { params })
  },

  obtener(id) {
    return http.get(`/sucursales/${id}`)
  },

  crear(datos) {
    return http.post('/sucursales', datos)
  },

  actualizar(id, datos) {
    return http.put(`/sucursales/${id}`, datos)
  },

  subirFoto(id, archivo) {
    const form = new FormData()
    form.append('archivo', archivo)
    return http.post(`/sucursales/${id}/foto`, form)
  },

  quitarFoto(id) {
    return http.delete(`/sucursales/${id}/foto`)
  },

  eliminar(id) {
    return http.delete(`/sucursales/${id}`)
  },

  urlFoto(sucursal) {
    return sucursal.foto ? `${env.apiUrl}${sucursal.foto}` : null
  },
}
