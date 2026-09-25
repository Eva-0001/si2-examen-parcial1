import { http } from '@/core/api/http'

export const asistenteService = {
  estado() {
    return http.get('/ia/estado')
  },

  consultar(mensaje, sucursalId) {
    return http.post('/ia/asistente', { mensaje, ...(sucursalId ? { sucursal_id: sucursalId } : {}) })
  },
}
