export const CIUDADES = [
  'Santa Cruz de la Sierra',
  'La Paz',
  'Cochabamba',
  'Sucre',
  'Tarija',
  'El Alto',
] as const;

export const CATEGORIAS = [
  'Poleras',
  'Camisas',
  'Vestidos',
  'Pantalones',
  'Chaquetas',
  'Buzos',
  'Accesorios',
] as const;

export const COLECCIONES: readonly { nombre: string; descripcion: string }[] = [
  {
    nombre: 'Rock Legends',
    descripcion: 'Prendas con arte de bandas y giras clasicas del rock.',
  },
  {
    nombre: 'Anime Wave',
    descripcion: 'Estampados inspirados en series y manga japones.',
  },
  {
    nombre: 'Esenciales',
    descripcion: 'Basicos de algodon peinado para el dia a dia.',
  },
  {
    nombre: 'Urbana 2025',
    descripcion: 'Cortes amplios y paleta neutra para la calle.',
  },
  {
    nombre: 'Deportiva Pro',
    descripcion: 'Tejidos tecnicos para entrenamiento y competencia.',
  },
  {
    nombre: 'Edicion Limitada',
    descripcion: 'Tirajes cortos numerados que no se reponen.',
  },
];

export const COLORES = [
  'Negro',
  'Blanco',
  'Gris jaspeado',
  'Vino',
  'Terracota',
  'Beige',
  'Azul marino',
  'Verde militar',
  'Rojo',
  'Rosa',
] as const;

export const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export const TEMPORADAS = [
  'Verano',
  'Otono',
  'Invierno',
  'Primavera',
  'Todo el ano',
] as const;

export interface DatosProveedor {
  nombre: string;
  descripcion: string;
  encargado: string;
  telefono: string;
}

export const PROVEEDORES: readonly DatosProveedor[] = [
  {
    nombre: 'Textiles Andinos SRL',
    descripcion: 'Algodon peinado y jersey liviano producido en El Alto.',
    encargado: 'Marcela Chuquimia',
    telefono: '70123456',
  },
  {
    nombre: 'Estampados Bolivia',
    descripcion: 'Serigrafia y DTG para tirajes cortos y medianos.',
    encargado: 'Ivan Suarez',
    telefono: '71234567',
  },
  {
    nombre: 'Import Moda Asia',
    descripcion: 'Importacion de prendas y accesorios desde Asia.',
    encargado: 'Karen Lin',
    telefono: '72345678',
  },
  {
    nombre: 'Confecciones del Valle',
    descripcion: 'Taller de confeccion en Cochabamba, vestidos y camisas.',
    encargado: 'Rodrigo Claros',
    telefono: '73456789',
  },
  {
    nombre: 'Deportex Distribuciones',
    descripcion: 'Linea deportiva y tejidos tecnicos.',
    encargado: 'Fernanda Aliaga',
    telefono: '74567890',
  },
];

export interface DatosSucursal {
  nombre: string;
  ubicacion: string;
  ciudad: string;
}

export const SUCURSALES: readonly DatosSucursal[] = [
  {
    nombre: 'FashionStore Equipetrol',
    ubicacion: 'Av. San Martin esq. 3er Anillo, Santa Cruz de la Sierra',
    ciudad: 'Santa Cruz de la Sierra',
  },
  {
    nombre: 'FashionStore Ventura Mall',
    ubicacion: 'Ventura Mall, Av. San Martin, Santa Cruz de la Sierra',
    ciudad: 'Santa Cruz de la Sierra',
  },
  {
    nombre: 'FashionStore Sopocachi',
    ubicacion: 'Av. 20 de Octubre 2033, La Paz',
    ciudad: 'La Paz',
  },
  {
    nombre: 'FashionStore El Prado',
    ubicacion: 'Av. Ballivian 567, Cochabamba',
    ciudad: 'Cochabamba',
  },
];

export interface DatosPromocion {
  nombre: string;
  descripcion: string;
  sucursal: string;
  /** Dias respecto de hoy: negativo = ya empezo. */
  desdeDias: number;
  hastaDias: number;
}

export const PROMOCIONES: readonly DatosPromocion[] = [
  {
    nombre: '2x1 en poleras de coleccion',
    descripcion: 'Llevando dos poleras Rock Legends o Anime Wave pagas una.',
    sucursal: 'FashionStore Equipetrol',
    desdeDias: -10,
    hastaDias: 20,
  },
  {
    nombre: 'Descuento 20% en Esenciales',
    descripcion: 'Basicos de algodon peinado con 20% menos durante el mes.',
    sucursal: 'FashionStore Ventura Mall',
    desdeDias: -5,
    hastaDias: 25,
  },
  {
    nombre: 'Liquidacion de temporada',
    descripcion: 'Ultimas tallas de la coleccion Otono a precio de costo.',
    sucursal: 'FashionStore Sopocachi',
    desdeDias: -30,
    hastaDias: -2,
  },
  {
    nombre: 'Envio gratis en compras sobre Bs 350',
    descripcion: 'Aplica a pedidos virtuales retirados en sucursal.',
    sucursal: 'FashionStore El Prado',
    desdeDias: 3,
    hastaDias: 45,
  },
  {
    nombre: 'Semana del cliente',
    descripcion: '15% de descuento presentando tu carnet en caja.',
    sucursal: 'FashionStore Equipetrol',
    desdeDias: 7,
    hastaDias: 14,
  },
];
