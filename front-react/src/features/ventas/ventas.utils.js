export function sucursalDeVenta(v) {
  return v.detalles.find((d) => d.producto_sucursal?.sucursal)?.producto_sucursal?.sucursal ?? null
}

export function unidadesDeVenta(v) {
  return v.detalles.reduce((acc, d) => acc + d.cantidad, 0)
}

export function fechaDeVenta(v, fechasBitacora) {
  const comprobante = [...v.comprobantes].sort((a, b) => a.fecha.localeCompare(b.fecha))[0]
  return comprobante?.fecha ?? fechasBitacora?.get(v.id) ?? null
}

export const ETIQUETA_TIPO = {
  virtual: 'Virtual',
  presencial: 'Presencial',
}

export const CHIP_TIPO = {
  virtual: 'bg-surface-container text-primary',
  presencial: 'bg-surface-container-low text-on-surface-variant',
}

export function numeroVenta(id) {
  return `#${String(id).padStart(6, '0')}`
}
