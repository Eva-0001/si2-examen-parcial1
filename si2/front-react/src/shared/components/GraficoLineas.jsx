import { useRef, useState } from 'react'

const ANCHO = 640
const MARGEN = { arriba: 16, derecha: 16, abajo: 28, izquierda: 56 }
const formatoPorDefecto = (v) => String(v)

function redondearArriba(v) {
  const magnitud = Math.pow(10, Math.floor(Math.log10(v)))
  const normalizado = v / magnitud
  const paso = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10
  return paso * magnitud
}

export default function GraficoLineas({ datos, formato = formatoPorDefecto, alto = 240 }) {
  const [activo, setActivo] = useState(null)
  const svgRef = useRef(null)

  const max = Math.max(0, ...datos.map((d) => d.valor))
  const maximo = max === 0 ? 1 : redondearArriba(max)

  const n = datos.length
  const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha
  const altoUtil = alto - MARGEN.arriba - MARGEN.abajo
  const puntos = datos.map((d, i) => ({
    ...d,
    x: MARGEN.izquierda + (n === 1 ? anchoUtil / 2 : (i / (n - 1)) * anchoUtil),
    y: MARGEN.arriba + altoUtil - (d.valor / maximo) * altoUtil,
  }))

  const trazo = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  const base = alto - MARGEN.abajo
  const area =
    puntos.length === 0
      ? ''
      : `${trazo} L${puntos[puntos.length - 1].x.toFixed(1)},${base} L${puntos[0].x.toFixed(1)},${base} Z`

  const grilla = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: MARGEN.arriba + altoUtil - f * altoUtil,
    valor: maximo * f,
  }))

  let etiquetasX = puntos
  if (puntos.length > 6) {
    const paso = Math.ceil(puntos.length / 6)
    etiquetasX = puntos.filter((_, i) => i % paso === 0 || i === puntos.length - 1)
  }

  const puntoActivo = activo === null ? null : (puntos[activo] ?? null)

  const alMover = (evento) => {
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((evento.clientX - rect.left) / rect.width) * ANCHO
    if (puntos.length === 0) return
    let cercano = 0
    for (let i = 1; i < puntos.length; i++) if (Math.abs(puntos[i].x - x) < Math.abs(puntos[cercano].x - x)) cercano = i
    setActivo(cercano)
  }

  const tooltipX = (p) => Math.min(Math.max(p.x - 70, MARGEN.izquierda), ANCHO - MARGEN.derecha - 140)

  if (datos.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-surface-container-low text-sm text-on-surface-variant"
        style={{ height: `${alto}px` }}
      >
        Sin datos para el período
      </div>
    )
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${ANCHO} ${alto}`}
      className="w-full select-none"
      style={{ height: `${alto}px` }}
      role="img"
      onMouseMove={alMover}
      onMouseLeave={() => setActivo(null)}
    >
      {grilla.map((g) => (
        <g key={g.y}>
          <line x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={g.y} y2={g.y} stroke="#e2e8f0" strokeWidth="1" />
          <text x={MARGEN.izquierda - 8} y={g.y + 4} textAnchor="end" fontSize="11" fill="#64748b">
            {formato(g.valor)}
          </text>
        </g>
      ))}

      <path d={area} fill="#4f46e5" fillOpacity="0.08" />
      <path d={trazo} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {etiquetasX.map((p) => (
        <text key={p.etiqueta} x={p.x} y={alto - 8} textAnchor="middle" fontSize="11" fill="#64748b">
          {p.etiqueta}
        </text>
      ))}

      {puntoActivo ? (
        <>
          <line
            x1={puntoActivo.x}
            x2={puntoActivo.x}
            y1={MARGEN.arriba}
            y2={alto - MARGEN.abajo}
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle cx={puntoActivo.x} cy={puntoActivo.y} r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
          <g
            transform={`translate(${tooltipX(puntoActivo)},${puntoActivo.y > 70 ? puntoActivo.y - 58 : puntoActivo.y + 14})`}
          >
            <rect width="140" height="44" rx="8" fill="#0f172a" />
            <text x="10" y="18" fontSize="11" fill="#cbd5e1">
              {puntoActivo.detalle ?? puntoActivo.etiqueta}
            </text>
            <text x="10" y="35" fontSize="13" fontWeight="600" fill="#ffffff">
              {formato(puntoActivo.valor)}
            </text>
          </g>
        </>
      ) : (
        puntos.map((p) => <circle key={p.etiqueta} cx={p.x} cy={p.y} r="3" fill="#4f46e5" />)
      )}
    </svg>
  )
}
