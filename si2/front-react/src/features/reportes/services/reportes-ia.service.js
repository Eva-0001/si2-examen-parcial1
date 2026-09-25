import { http } from '@/core/api/http'

export const reportesIaService = {
  estado() {
    return http.get('/ia/estado')
  },

  generar(pregunta) {
    return http.post('/ia/reportes', { pregunta })
  },
}
