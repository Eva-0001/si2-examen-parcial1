export function monedaBs(valor) {
  const numero = typeof valor === 'string' ? Number(valor) : valor
  if (numero === null || numero === undefined || Number.isNaN(numero)) return ''

  const formateado = numero.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `Bs ${formateado}`
}
