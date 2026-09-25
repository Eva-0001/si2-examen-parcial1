import { loadStripe } from '@stripe/stripe-js'
import { http } from '@/core/api/http'
import { env } from '@/config/env'

let stripeCargado = null

export const pagosService = {
  habilitado: !!env.stripePublishableKey,

  config() {
    return http.get('/pagos/config')
  },

  crearIntencion(detalles) {
    return http.post('/pagos/intencion', { detalles })
  },

  stripe() {
    if (!this.habilitado) return Promise.resolve(null)
    stripeCargado ??= loadStripe(env.stripePublishableKey)
    return stripeCargado
  },
}
