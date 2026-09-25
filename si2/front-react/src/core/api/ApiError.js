export class ApiError extends Error {
  constructor(status, mensaje) {
    super(mensaje)
    this.status = status
    this.name = 'ApiError'
  }
}
