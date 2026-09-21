const NOMBRES = {
  negro: '#111827',
  blanco: '#ffffff',
  gris: '#9ca3af',
  plomo: '#6b7280',
  rojo: '#dc2626',
  bordo: '#7f1d1d',
  vino: '#7f1d1d',
  guindo: '#881337',
  rosa: '#f472b6',
  rosado: '#f9a8d4',
  fucsia: '#db2777',
  naranja: '#f97316',
  amarillo: '#facc15',
  mostaza: '#ca8a04',
  dorado: '#d4a017',
  beige: '#e7d8b1',
  crema: '#f5f0e1',
  marfil: '#fffff0',
  arena: '#d9c7a3',
  cafe: '#78350f',
  marron: '#78350f',
  chocolate: '#5b2c0f',
  camel: '#c19a6b',
  verde: '#16a34a',
  oliva: '#6b8e23',
  militar: '#4b5320',
  menta: '#99f6e4',
  turquesa: '#14b8a6',
  celeste: '#7dd3fc',
  azul: '#2563eb',
  marino: '#1e3a8a',
  indigo: '#4f46e5',
  violeta: '#7c3aed',
  morado: '#6d28d9',
  lila: '#c4b5fd',
  lavanda: '#c4b5fd',
  plateado: '#c0c0c0',
  denim: '#3b5b8f',
  jean: '#3b5b8f',
}

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function colorDesdeNombre(nombre) {
  const limpio = normalizar(nombre)
  if (NOMBRES[limpio]) return NOMBRES[limpio]

  const palabras = limpio.split(/\s+/)
  for (let i = palabras.length - 1; i >= 0; i--) {
    if (NOMBRES[palabras[i]]) return NOMBRES[palabras[i]]
  }

  let hash = 0
  for (const c of limpio) hash = (hash * 31 + c.charCodeAt(0)) >>> 0
  return `hsl(${hash % 360} 55% 55%)`
}

export function esColorClaro(color) {
  if (!color.startsWith('#') || color.length !== 7) return false
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 200
}
