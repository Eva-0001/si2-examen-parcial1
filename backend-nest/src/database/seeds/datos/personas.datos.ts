import { Genero } from '../../../commons/enums/genero.enum.js';
import { Rol } from '../../../commons/enums/rol.enum.js';

export interface DatosUsuario {
  nombre: string;
  apellido: string;
  username: string;
  correo: string;
  genero: Genero;
  rol: Rol;
  /** Solo para el personal: crea ademas la fila en `trabajador`. */
  trabajador?: {
    codigo: string;
    sucursal: string;
    sueldo: number;
    /** Dias hacia atras desde hoy para la fecha de contrato. */
    antiguedadDias: number;
  };
}

export const PERSONAL: readonly DatosUsuario[] = [
  {
    nombre: 'Elena',
    apellido: 'Cabrera',
    username: 'ecabrera',
    correo: 'elena.cabrera@tienda.com',
    genero: Genero.FEMENINO,
    rol: Rol.ENCARGADO,
    trabajador: {
      codigo: 'ENC-001',
      sucursal: 'FashionStore Equipetrol',
      sueldo: 6800,
      antiguedadDias: 900,
    },
  },
  {
    nombre: 'Ruben',
    apellido: 'Mamani',
    username: 'rmamani',
    correo: 'ruben.mamani@tienda.com',
    genero: Genero.MASCULINO,
    rol: Rol.ENCARGADO,
    trabajador: {
      codigo: 'ENC-002',
      sucursal: 'FashionStore Sopocachi',
      sueldo: 6500,
      antiguedadDias: 620,
    },
  },
  {
    nombre: 'Lucia',
    apellido: 'Quispe',
    username: 'lquispe',
    correo: 'lucia.quispe@tienda.com',
    genero: Genero.FEMENINO,
    rol: Rol.CAJERO,
    trabajador: {
      codigo: 'CAJ-001',
      sucursal: 'FashionStore Equipetrol',
      sueldo: 4200,
      antiguedadDias: 400,
    },
  },
  {
    nombre: 'Diego',
    apellido: 'Vaca',
    username: 'dvaca',
    correo: 'diego.vaca@tienda.com',
    genero: Genero.MASCULINO,
    rol: Rol.CAJERO,
    trabajador: {
      codigo: 'CAJ-002',
      sucursal: 'FashionStore Ventura Mall',
      sueldo: 4200,
      antiguedadDias: 260,
    },
  },
  {
    nombre: 'Marisol',
    apellido: 'Flores',
    username: 'mflores',
    correo: 'marisol.flores@tienda.com',
    genero: Genero.FEMENINO,
    rol: Rol.CAJERO,
    trabajador: {
      codigo: 'CAJ-003',
      sucursal: 'FashionStore El Prado',
      sueldo: 4000,
      antiguedadDias: 150,
    },
  },
  {
    nombre: 'Ivan',
    apellido: 'Suarez',
    username: 'isuarez',
    correo: 'ivan.suarez@estampadosbolivia.com',
    genero: Genero.MASCULINO,
    rol: Rol.PROVEEDOR,
  },
  {
    nombre: 'Marcela',
    apellido: 'Chuquimia',
    username: 'mchuquimia',
    correo: 'marcela.chuquimia@textilesandinos.com',
    genero: Genero.FEMENINO,
    rol: Rol.PROVEEDOR,
  },
];

export const CLIENTES: readonly DatosUsuario[] = [
  {
    nombre: 'Camila',
    apellido: 'Rojas',
    username: 'camila',
    correo: 'camila.rojas@gmail.com',
    genero: Genero.FEMENINO,
    rol: Rol.CLIENTE,
  },
  {
    nombre: 'Joaquin',
    apellido: 'Terrazas',
    username: 'joaquin',
    correo: 'joaquin.terrazas@gmail.com',
    genero: Genero.MASCULINO,
    rol: Rol.CLIENTE,
  },
  {
    nombre: 'Valeria',
    apellido: 'Ortiz',
    username: 'valeria',
    correo: 'valeria.ortiz@gmail.com',
    genero: Genero.FEMENINO,
    rol: Rol.CLIENTE,
  },
  {
    nombre: 'Sebastian',
    apellido: 'Arce',
    username: 'sebastian',
    correo: 'sebastian.arce@gmail.com',
    genero: Genero.MASCULINO,
    rol: Rol.CLIENTE,
  },
  {
    nombre: 'Daniela',
    apellido: 'Montano',
    username: 'daniela',
    correo: 'daniela.montano@gmail.com',
    genero: Genero.FEMENINO,
    rol: Rol.CLIENTE,
  },
  {
    nombre: 'Mauricio',
    apellido: 'Peredo',
    username: 'mauricio',
    correo: 'mauricio.peredo@gmail.com',
    genero: Genero.MASCULINO,
    rol: Rol.CLIENTE,
  },
  {
    nombre: 'Andrea',
    apellido: 'Vargas',
    username: 'andrea',
    correo: 'andrea.vargas@gmail.com',
    genero: Genero.FEMENINO,
    rol: Rol.CLIENTE,
  },
  {
    nombre: 'Gabriel',
    apellido: 'Nunez',
    username: 'gabriel',
    correo: 'gabriel.nunez@gmail.com',
    genero: Genero.MASCULINO,
    rol: Rol.CLIENTE,
  },
];
