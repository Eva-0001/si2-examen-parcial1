const ESTILOS = {
  administrador: {
    etiqueta: 'Administrador',
    descripcion: 'Gestiona todo el sistema',
    chip: 'bg-surface-container text-primary',
  },
  encargado: {
    etiqueta: 'Encargado',
    descripcion: 'Inventario y reservas de su sucursal',
    chip: 'bg-sky-100 text-sky-800',
  },
  cajero: {
    etiqueta: 'Cajero',
    descripcion: 'Ventas presenciales y comprobantes',
    chip: 'bg-amber-100 text-amber-800',
  },
  proveedor: {
    etiqueta: 'Proveedor',
    descripcion: 'Registra y actualiza sus productos',
    chip: 'bg-violet-100 text-violet-800',
  },
  cliente: {
    etiqueta: 'Cliente',
    descripcion: 'Compra, reserva y consulta lo suyo',
    chip: 'bg-surface-container-low text-on-surface-variant',
  },
}

const NEUTRO = {
  etiqueta: '',
  descripcion: 'Rol creado por el administrador',
  chip: 'bg-surface-container-low text-on-surface',
}

export function estiloRol(nombre) {
  if (!nombre) return { ...NEUTRO, etiqueta: 'Sin rol' }
  const conocido = ESTILOS[nombre.toLowerCase()]
  if (conocido) return conocido
  return { ...NEUTRO, etiqueta: nombre.charAt(0).toUpperCase() + nombre.slice(1) }
}

export function esRolDelSistema(nombre) {
  return nombre.toLowerCase() in ESTILOS
}
