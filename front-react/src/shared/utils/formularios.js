export const requerido = { value: true, message: 'Este campo es obligatorio' }

export const minimo = (n) => ({ value: n, message: `Mínimo ${n} caracteres` })

export const maximo = (n) => ({ value: n, message: `Máximo ${n} caracteres` })

export const PATRON_USERNAME = /^[a-zA-Z0-9._]+$/

export const patronUsername = {
  value: PATRON_USERNAME,
  message: 'Solo letras, números, punto y guion bajo',
}

const EMAIL_REGEXP =
  /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

export function correoValido(valor) {
  if (valor === null || valor === undefined || valor === '') return true
  return EMAIL_REGEXP.test(valor) || 'Ingresa un correo válido'
}

export function coincideCon(obtenerOtro) {
  return (valor) => valor === obtenerOtro() || 'Las contraseñas no coinciden'
}

export function nombreUnico(ocupados, actual = () => null) {
  const normalizar = (v) => v.trim().toLowerCase()
  return (valor) => {
    const limpio = normalizar(String(valor ?? ''))
    if (!limpio) return true
    const propio = actual()
    const repetido = ocupados().some(
      (n) => normalizar(n) === limpio && (propio === null || normalizar(propio) !== limpio),
    )
    return repetido ? 'Ya existe un registro con ese nombre' : true
  }
}

export function numeroONulo(valor) {
  return valor === '' || valor === null || valor === undefined ? null : Number(valor)
}

export function errorDe(error) {
  if (!error) return null
  return error.message || 'Valor no válido'
}

export function marcarErrorApi(setError, campo, mensaje) {
  setError(campo, { type: 'api', message: mensaje })
}
