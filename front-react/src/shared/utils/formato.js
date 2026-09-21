const MESES_CORTOS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MESES_LARGOS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const DIAS_CORTOS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DIAS_LARGOS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const SOLO_FECHA = /^(\d{4}(-\d{1,2}(-\d{1,2})?)?)$/
const ISO8601 =
  /^(\d{4,})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/
const TOKENS = /('(?:[^']|'')*'|y{1,4}|M{1,4}|d{1,2}|E{1,4}|H{1,2}|m{1,2}|s{1,2})/g

function aFecha(valor) {
  if (valor instanceof Date) return valor
  if (typeof valor === 'number') return new Date(valor)

  const texto = String(valor).trim()
  if (SOLO_FECHA.test(texto)) {
    const [a, m = 1, d = 1] = texto.split('-').map(Number)
    return new Date(a, m - 1, d)
  }

  const match = texto.match(ISO8601)
  if (match) {
    const fecha = new Date(0)
    let tzHora = 0
    let tzMin = 0
    const fijarFecha = match[8] ? fecha.setUTCFullYear : fecha.setFullYear
    const fijarHora = match[8] ? fecha.setUTCHours : fecha.setHours
    if (match[9]) {
      tzHora = Number(match[9] + match[10])
      tzMin = Number(match[9] + match[11])
    }
    fijarFecha.call(fecha, Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    const h = Number(match[4] || 0) - tzHora
    const min = Number(match[5] || 0) - tzMin
    const s = Number(match[6] || 0)
    const ms = Math.floor(parseFloat('0.' + (match[7] || 0)) * 1000)
    fijarHora.call(fecha, h, min, s, ms)
    return fecha
  }

  return new Date(texto)
}

const dos = (n) => String(n).padStart(2, '0')

export function formatoFecha(valor, formato = 'mediumDate') {
  if (valor === null || valor === undefined || valor === '') return ''
  const f = aFecha(valor)
  if (Number.isNaN(f.getTime())) return ''

  return formato.replace(TOKENS, (token) => {
    if (token.startsWith("'")) return token.slice(1, -1).replace(/''/g, "'")
    switch (token) {
      case 'yyyy':
        return String(f.getFullYear()).padStart(4, '0')
      case 'yy':
        return dos(f.getFullYear() % 100)
      case 'y':
        return String(f.getFullYear())
      case 'MMMM':
        return MESES_LARGOS[f.getMonth()]
      case 'MMM':
        return MESES_CORTOS[f.getMonth()]
      case 'MM':
        return dos(f.getMonth() + 1)
      case 'M':
        return String(f.getMonth() + 1)
      case 'dd':
        return dos(f.getDate())
      case 'd':
        return String(f.getDate())
      case 'EEEE':
        return DIAS_LARGOS[f.getDay()]
      case 'EEE':
      case 'EE':
      case 'E':
        return DIAS_CORTOS[f.getDay()]
      case 'HH':
        return dos(f.getHours())
      case 'H':
        return String(f.getHours())
      case 'mm':
        return dos(f.getMinutes())
      case 'm':
        return String(f.getMinutes())
      case 'ss':
        return dos(f.getSeconds())
      case 's':
        return String(f.getSeconds())
      default:
        return token
    }
  })
}

export function formatoNumero(valor, digitos = '1.0-3') {
  const numero = typeof valor === 'string' ? Number(valor) : valor
  if (numero === null || numero === undefined || Number.isNaN(numero)) return ''

  const [, minEnteros = '1', minDec = '0', maxDec = '3'] = digitos.match(/^(\d+)?\.(\d+)?-?(\d+)?$/) ?? []
  return numero.toLocaleString('en-US', {
    minimumIntegerDigits: Number(minEnteros),
    minimumFractionDigits: Number(minDec),
    maximumFractionDigits: Math.max(Number(minDec), Number(maxDec)),
  })
}
