export function etiquetaPromo(nombre, descripcion) {
  const texto = `${nombre} ${descripcion ?? ''}`
  const nxm = texto.match(/\b(\d)\s?x\s?(\d)\b/i)
  if (nxm) return `${nxm[1]}x${nxm[2]}`
  const porcentaje = texto.match(/(\d{1,2})\s?%/)
  if (porcentaje) return `-${porcentaje[1]}%`
  if (/liquidaci[oó]n/i.test(texto)) return 'Liquidación'
  if (/env[ií]o gratis/i.test(texto)) return 'Envío gratis'
  return 'Promo'
}
