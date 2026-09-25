const PALABRAS_VACIAS = new Set(
  (
    'a al algo alguna alguno algunas algunos algun busco buscando busca con cual cuales dame de del el en es esa ese esta este ' +
    'hay la las lo los me mi mis muestrame muestra mostrar necesito o para por prenda prendas que quiero quisiera ropa se si ' +
    'sus su tienen tienes tiene tengo un una unas unos y ver talla tallas color colores hola gracias favor porfa ' +
    'bs bolivianos presupuesto precio barato barata baratos baratas economico economica economicos economicas'
  ).split(' '),
)

// Criterios que se buscan en las tablas relacionadas del producto.
const ATRIBUTOS = [
  { recurso: 'categorias', campo: 'categoria_id', texto: (n) => `en ${n.toLowerCase()}` },
  { recurso: 'colecciones', campo: 'coleccion_id', texto: (n) => `de la colección ${n}` },
  { recurso: 'temporadas', campo: 'temporada_id', texto: (n) => `para ${n}` },
  { recurso: 'colores', campo: 'color_id', texto: (n) => `en color ${n.toLowerCase()}` },
  { recurso: 'tallas', campo: 'talla_id', texto: (n) => `en talla ${n}` },
]

const normalizar = (t) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Raíz simple para que "negra", "negros" y "negro" coincidan. */
function raiz(palabra) {
  let p = palabra
  if (p.length > 4) p = p.replace(/(es|s)$/, '')
  if (p.length > 3) p = p.replace(/[aoe]$/, '')
  return p
}

const palabrasDe = (texto) => normalizar(texto).split(/[^a-z0-9]+/).filter(Boolean)

const NUM = String.raw`(\d+(?:[.,]\d+)?)`
const BS = String.raw`(?:bs\.?\s*)?`
const SUFIJO_BS = String.raw`(?:\s*(?:bs\b\.?|bolivianos))?`
const aNumero = (s) => Number(s.replace(',', '.'))

/** Saca del texto el presupuesto ("hasta 150 bs", "entre 100 y 200", "barato"). */
function extraerPresupuesto(texto) {
  let resto = texto
  const presupuesto = { min: null, max: null, barato: /\b(barat|economic)/.test(texto) }
  const quitar = (m) => {
    resto = resto.replace(m[0], ' ')
  }

  const entre = resto.match(new RegExp(String.raw`\bentre\s+${BS}${NUM}${SUFIJO_BS}\s+y\s+${BS}${NUM}${SUFIJO_BS}`))
  if (entre) {
    const [a, b] = [aNumero(entre[1]), aNumero(entre[2])].sort((x, y) => x - y)
    presupuesto.min = a
    presupuesto.max = b
    quitar(entre)
  }

  const maximo = resto.match(
    new RegExp(
      String.raw`\b(?:hasta|menos de|maximo|max|no mas de|por debajo de|que no pase de|presupuesto(?: de)?)\s+${BS}${NUM}${SUFIJO_BS}`,
    ),
  )
  if (maximo) {
    presupuesto.max = aNumero(maximo[1])
    quitar(maximo)
  }

  const minimo = resto.match(
    new RegExp(String.raw`\b(?:desde|mas de|minimo|arriba de|por encima de)\s+${BS}${NUM}${SUFIJO_BS}`),
  )
  if (minimo) {
    presupuesto.min = aNumero(minimo[1])
    quitar(minimo)
  }

  // Un monto suelto con "bs" se toma como tope: "algo de 150 bs".
  if (presupuesto.max === null && presupuesto.min === null) {
    const suelto = resto.match(new RegExp(String.raw`\bbs\.?\s*${NUM}|${NUM}\s*(?:bs\b|bolivianos)`))
    if (suelto) {
      presupuesto.max = aNumero(suelto[1] ?? suelto[2])
      quitar(suelto)
    }
  }

  const activo = presupuesto.min !== null || presupuesto.max !== null || presupuesto.barato
  return { presupuesto: activo ? presupuesto : null, resto }
}

function textoPresupuesto(p) {
  if (p.min !== null && p.max !== null) return `entre Bs ${p.min} y Bs ${p.max}`
  if (p.max !== null) return `hasta Bs ${p.max}`
  if (p.min !== null) return `desde Bs ${p.min}`
  return 'de menor precio'
}

/** Ids del recurso cuyo nombre aparece en el mensaje, y las palabras que usó. */
function coincidencias(recurso, lista, palabras, textoNormal) {
  const ids = new Set()
  const usadas = new Set()
  for (const item of lista) {
    const nombre = normalizar(item.nombre)
    if (recurso === 'tallas') {
      // Tallas de una letra ("M", "S") solo cuentan si dicen "talla M".
      const patron = nombre.length === 1 ? new RegExp(`\\btalla\\s+${nombre}\\b`) : new RegExp(`\\b${nombre}\\b`)
      if (patron.test(textoNormal)) {
        ids.add(item.id)
        usadas.add(nombre)
      }
      continue
    }
    for (const parte of palabrasDe(nombre)) {
      if (parte.length < 3 || PALABRAS_VACIAS.has(parte)) continue
      const r = raiz(parte)
      const encontrada = palabras.find((p) => raiz(p) === r)
      if (encontrada) {
        ids.add(item.id)
        usadas.add(encontrada)
      }
    }
  }
  return { ids, usadas }
}

const disponible = (s) => Math.max(0, s.cantidad - (s.cantidad_reservada ?? 0))

/**
 * Tarjeta de una prenda para el chat a partir de las variantes elegidas: disponibilidad,
 * precio con stock (primero en la sucursal) y la variante a la que lleva el enlace.
 */
export function tarjetaDe(catalogo, grupo, variantes, sucursalId) {
  let enSucursal = 0
  let enOtras = 0
  let precioSucursal = null
  let precioOtras = null
  let destacada = null

  for (const v of variantes) {
    for (const s of catalogo.stockPorProducto.get(v.id) ?? []) {
      const unidades = disponible(s)
      if (unidades === 0) continue
      const precio = Number(s.precio)
      if (s.sucursal_id === sucursalId) {
        enSucursal += unidades
        precioSucursal = precioSucursal === null ? precio : Math.min(precioSucursal, precio)
        destacada ??= v
      } else {
        enOtras += unidades
        precioOtras = precioOtras === null ? precio : Math.min(precioOtras, precio)
      }
    }
  }

  if (enSucursal + enOtras === 0) return null
  return {
    ...grupo,
    id: (destacada ?? variantes[0]).id,
    clave: `${grupo.clave}-${(destacada ?? variantes[0]).id}`,
    disponibilidad: enSucursal > 0 ? 'disponible' : 'otras',
    precioDesde: enSucursal > 0 ? precioSucursal : precioOtras,
    enSucursal,
  }
}

/** Tarjeta para un producto que eligió la IA. */
export function tarjetaDeProducto(catalogo, productoId, sucursalId) {
  const grupo = catalogo.grupoPorId(productoId)
  if (!grupo) return null
  const variante = grupo.variantes.find((v) => v.id === productoId)
  return tarjetaDe(catalogo, grupo, variante ? [variante] : grupo.variantes, sucursalId)
}

/**
 * Busca prendas del catálogo a partir del mensaje del cliente. Usa el producto, sus tablas
 * relacionadas (categoría, colección, temporada, color y talla) y el presupuesto.
 * Devuelve null si el mensaje no pide nada concreto, y `buscado` si pide algo que no
 * reconoce (por ejemplo "ropa para el frío"), para que el chat se lo pase a la IA.
 */
export function buscarPrendas(texto, { catalogo, listaReferencia, nombreReferencia, sucursalId, maximo = 4 }) {
  const { presupuesto, resto } = extraerPresupuesto(normalizar(texto))
  const textoNormal = resto
  const palabras = palabrasDe(resto)

  const criterios = []
  const usadas = new Set()
  for (const atributo of ATRIBUTOS) {
    const encontrados = coincidencias(atributo.recurso, listaReferencia(atributo.recurso), palabras, textoNormal)
    if (encontrados.ids.size === 0) continue
    criterios.push({ ...atributo, ids: encontrados.ids })
    encontrados.usadas.forEach((p) => usadas.add(p))
  }

  // Palabras sueltas que no son un atributo: se buscan en el nombre de la prenda.
  const raicesNombre = (grupo) => palabrasDe(grupo.nombre).map(raiz)
  const sueltas = palabras.filter((p) => p.length >= 3 && !/^\d+$/.test(p) && !PALABRAS_VACIAS.has(p) && !usadas.has(p))
  const libres = sueltas
    .map(raiz)
    .filter((r) => catalogo.grupos.some((g) => raicesNombre(g).some((n) => n.startsWith(r))))

  if (criterios.length === 0 && libres.length === 0) {
    if (sueltas.length > 0) return { productos: [], total: 0, filtros: [], buscado: sueltas.join(' ') }
    if (!presupuesto) return null
  }

  const resultados = []
  for (const grupo of catalogo.grupos) {
    const nombre = raicesNombre(grupo)
    const puntaje = libres.filter((r) => nombre.some((n) => n.startsWith(r))).length
    if (libres.length > 0 && puntaje === 0) continue

    const variantes = grupo.variantes.filter((v) => criterios.every((c) => c.ids.has(v[c.campo])))
    if (variantes.length === 0) continue

    const tarjeta = tarjetaDe(catalogo, grupo, variantes, sucursalId)
    if (!tarjeta) continue
    if (presupuesto?.max != null && tarjeta.precioDesde > presupuesto.max) continue
    if (presupuesto?.min != null && tarjeta.precioDesde < presupuesto.min) continue

    resultados.push({ ...tarjeta, puntaje })
  }

  resultados.sort(
    (a, b) =>
      b.puntaje - a.puntaje ||
      (presupuesto?.barato ? a.precioDesde - b.precioDesde : 0) ||
      (a.disponibilidad === 'disponible' ? 0 : 1) - (b.disponibilidad === 'disponible' ? 0 : 1) ||
      b.enSucursal - a.enSucursal,
  )

  const filtros = criterios.map((c) =>
    c.texto(
      [...c.ids]
        .map((id) => nombreReferencia(c.recurso, id))
        .filter(Boolean)
        .join(' o '),
    ),
  )
  if (presupuesto) filtros.push(textoPresupuesto(presupuesto))

  return { productos: resultados.slice(0, maximo), total: resultados.length, filtros }
}
