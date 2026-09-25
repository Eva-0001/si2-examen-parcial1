export enum Rol {
  ADMINISTRADOR = 'administrador',
  ENCARGADO = 'encargado',
  CAJERO = 'cajero',
  PROVEEDOR = 'proveedor',
  CLIENTE = 'cliente',
}

export const ROLES_DEL_SISTEMA: readonly Rol[] = Object.values(Rol);

export const ROL_POR_DEFECTO = Rol.CLIENTE;

export const CAPACIDAD = {
  catalogo: [Rol.ADMINISTRADOR, Rol.PROVEEDOR],
  inventario: [Rol.ADMINISTRADOR, Rol.ENCARGADO],
  caja: [Rol.ADMINISTRADOR, Rol.CAJERO],
  reservas: [Rol.ADMINISTRADOR, Rol.ENCARGADO],
  reportes: [Rol.ADMINISTRADOR, Rol.ENCARGADO, Rol.CAJERO],
  venta: [Rol.ADMINISTRADOR, Rol.ENCARGADO, Rol.CAJERO, Rol.CLIENTE],
} as const satisfies Record<string, readonly Rol[]>;
