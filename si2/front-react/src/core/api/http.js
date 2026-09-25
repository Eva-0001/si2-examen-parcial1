import axios from 'axios'
import { env } from '@/config/env'
import { ApiError } from './ApiError'
import { obtenerToken, useAuthStore } from '../stores/auth.store'

export const http = axios.create({ baseURL: env.apiUrl })

http.interceptors.request.use((config) => {
  const token = obtenerToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const status = error.response?.status ?? 0
    const esLogin = (error.config?.url ?? '').includes('/auth/login')
    if (status === 401 && !esLogin) {
      useAuthStore.getState().expirarSesion()
    }
    return Promise.reject(new ApiError(status, extraerMensaje(status, error.response?.data)))
  },
)

function extraerMensaje(status, cuerpo) {
  if (status === 0) return 'No pudimos conectarnos al servidor'

  const detail = cuerpo?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((d) => d?.msg)
      .filter(Boolean)
      .join('. ')
  }

  return 'Ocurrió un error inesperado'
}

export function limpiarParams(filtros = {}) {
  const params = {}
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') params[clave] = valor
  }
  return params
}
