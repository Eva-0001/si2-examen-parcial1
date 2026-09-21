export default function Skeleton({ tipo = 'bloque', cantidad = 5 }) {
  const filas = Array.from({ length: cantidad })

  if (tipo === 'tabla') {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 rounded-lg bg-surface-container-low"></div>
        {filas.map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-surface-container-low"></div>
        ))}
      </div>
    )
  }

  if (tipo === 'tarjetas') {
    return (
      <div className="grid animate-pulse grid-cols-2 gap-4 md:grid-cols-4">
        {filas.map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square rounded-xl bg-surface-container-low"></div>
            <div className="h-4 w-3/4 rounded bg-surface-container-low"></div>
            <div className="h-4 w-1/3 rounded bg-surface-container-low"></div>
          </div>
        ))}
      </div>
    )
  }

  return <div className="h-32 animate-pulse rounded-xl bg-surface-container-low"></div>
}
