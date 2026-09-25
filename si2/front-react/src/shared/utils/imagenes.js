export const TIPO_POR_EXTENSION = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jpe': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

const TIPOS = [...new Set(Object.values(TIPO_POR_EXTENSION))]

export const IMAGENES_ACEPTADAS = [...TIPOS, ...Object.keys(TIPO_POR_EXTENSION)].join(',')

export const FORMATOS_IMAGEN = 'JPG, JPEG, JPE, PNG, WEBP o GIF'

function extensionDe(nombre) {
  const punto = nombre.lastIndexOf('.')
  return punto === -1 ? '' : nombre.slice(punto).toLowerCase()
}

export function prepararImagen(archivo) {
  const tipo = TIPO_POR_EXTENSION[extensionDe(archivo.name)]
  if (!tipo) return null
  if (archivo.type && !archivo.type.startsWith('image/')) return null
  if (TIPOS.includes(archivo.type)) return archivo
  return new File([archivo], archivo.name, { type: tipo, lastModified: archivo.lastModified })
}
