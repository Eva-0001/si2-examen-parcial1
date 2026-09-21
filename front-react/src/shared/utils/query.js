export function codificarQuery(valor) {
  return encodeURIComponent(valor)
    .replace(/%40/g, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%3B/gi, ';')
}

export function conQuery(ruta, params = {}) {
  const partes = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${codificarQuery(k)}=${codificarQuery(String(v))}`)
  return partes.length ? `${ruta}?${partes.join('&')}` : ruta
}
