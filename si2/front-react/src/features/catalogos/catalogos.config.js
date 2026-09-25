export const PESTANAS_CATALOGO = [
  {
    recurso: 'categorias',
    etiqueta: 'Categorías',
    singular: 'categoría',
    femenino: true,
    icono: 'category',
    descripcionPestana: 'Tipos de prenda: poleras, camisas, jeans, vestidos.',
    conDescripcion: false,
    vista: 'tabla',
    placeholder: 'Ej. Poleras',
  },
  {
    recurso: 'colecciones',
    etiqueta: 'Colecciones',
    singular: 'colección',
    femenino: true,
    icono: 'style',
    descripcionPestana: 'Líneas de diseño que agrupan prendas: urbana, deportiva, formal.',
    conDescripcion: true,
    vista: 'tabla',
    placeholder: 'Ej. Urbana',
  },
  {
    recurso: 'colores',
    etiqueta: 'Colores',
    singular: 'color',
    femenino: false,
    icono: 'palette',
    descripcionPestana: 'Cada combinación de color y talla es un producto distinto.',
    conDescripcion: false,
    vista: 'colores',
    placeholder: 'Ej. Azul marino',
  },
  {
    recurso: 'tallas',
    etiqueta: 'Tallas',
    singular: 'talla',
    femenino: true,
    icono: 'straighten',
    descripcionPestana: 'Se muestran ordenadas de menor a mayor: XS, S, M, L, XL.',
    conDescripcion: false,
    vista: 'chips',
    placeholder: 'Ej. M',
  },
  {
    recurso: 'temporadas',
    etiqueta: 'Temporadas',
    singular: 'temporada',
    femenino: true,
    icono: 'sunny',
    descripcionPestana: 'Primavera-Verano, Otoño-Invierno, escolar, promociones especiales.',
    conDescripcion: false,
    vista: 'tabla',
    placeholder: 'Ej. Primavera-Verano 2026',
  },
]

const ORDEN_TALLAS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '4XL', '5XL']

export function compararTallas(a, b) {
  const ia = ORDEN_TALLAS.indexOf(a.toUpperCase().trim())
  const ib = ORDEN_TALLAS.indexOf(b.toUpperCase().trim())
  if (ia !== -1 || ib !== -1) {
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  }

  const na = Number(a)
  const nb = Number(b)
  const esNumA = !Number.isNaN(na)
  const esNumB = !Number.isNaN(nb)
  if (esNumA && esNumB) return na - nb
  if (esNumA) return -1
  if (esNumB) return 1

  return a.localeCompare(b, 'es')
}
