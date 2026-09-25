import { http } from '../api/http'
import { useAuthStore } from '../stores/auth.store'

export const authService = {
  async login(credenciales) {
    const res = await http.post('/auth/login', credenciales)
    useAuthStore.getState().guardarSesion(res)
    return res
  },

  async registro(datos) {
    const res = await http.post('/auth/registro', { ...datos, rol_id: 0 })
    useAuthStore.getState().guardarSesion(res)
    return res
  },

  me() {
    return http.get('/auth/me')
  },
}
