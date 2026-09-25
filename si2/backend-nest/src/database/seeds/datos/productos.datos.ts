/**
 * Cada diseno se convierte en un producto por talla (asi lo modela el esquema:
 * `productos.talla_id` es una columna del producto, no una variante aparte).
 * `archivo` es el nombre tal cual aparece en la carpeta `seed/`.
 */
export interface DatosDiseno {
  base: string;
  archivo: string;
  categoria: string;
  coleccion: string;
  color: string;
  temporada: string;
  proveedor: string;
  /** Precio de lista en Bs; cada sucursal lo ajusta levemente. */
  precio: number;
  tallas: readonly string[];
}

export const DISENOS: readonly DatosDiseno[] = [
  {
    base: 'Polera Metallica Sad But True',
    archivo: '5.sadbuttruefront.webp',
    categoria: 'Poleras',
    coleccion: 'Rock Legends',
    color: 'Negro',
    temporada: 'Todo el ano',
    proveedor: 'Estampados Bolivia',
    precio: 189,
    tallas: ['S', 'M', 'L', 'XL'],
  },
  {
    base: 'Polera Pearl Jam Alive',
    archivo: 'Copiadepearl-jam_alive56negromujer.webp',
    categoria: 'Poleras',
    coleccion: 'Rock Legends',
    color: 'Negro',
    temporada: 'Todo el ano',
    proveedor: 'Estampados Bolivia',
    precio: 179,
    tallas: ['XS', 'S', 'M'],
  },
  {
    base: 'Polera Paulo Londra Back Print',
    archivo: 'POLERA-NEGRA-ESPALDA-PAULO-LONDRA.webp',
    categoria: 'Poleras',
    coleccion: 'Urbana 2025',
    color: 'Negro',
    temporada: 'Verano',
    proveedor: 'Estampados Bolivia',
    precio: 165,
    tallas: ['S', 'M', 'L'],
  },
  {
    base: 'Polera Naruto Equipo 7',
    archivo: '900.webp',
    categoria: 'Poleras',
    coleccion: 'Anime Wave',
    color: 'Negro',
    temporada: 'Todo el ano',
    proveedor: 'Import Moda Asia',
    precio: 199,
    tallas: ['S', 'M', 'L', 'XL'],
  },
  {
    base: 'Polera Respira y Vuelve a Ti',
    archivo: 'captura_1_16df30fc-5f76-400c-bedb-ede4e981bcf1.webp',
    categoria: 'Poleras',
    coleccion: 'Edicion Limitada',
    color: 'Vino',
    temporada: 'Otono',
    proveedor: 'Estampados Bolivia',
    precio: 155,
    tallas: ['S', 'M', 'L'],
  },
  {
    base: 'Polera basica Heather Grey',
    archivo: '4010677_10122_Heather-Grey_01_LF-1.png',
    categoria: 'Poleras',
    coleccion: 'Esenciales',
    color: 'Gris jaspeado',
    temporada: 'Todo el ano',
    proveedor: 'Textiles Andinos SRL',
    precio: 119,
    tallas: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    base: 'Polera negra esencial',
    archivo: 'mujerNegra2025_1000x1179.png',
    categoria: 'Poleras',
    coleccion: 'Esenciales',
    color: 'Negro',
    temporada: 'Todo el ano',
    proveedor: 'Textiles Andinos SRL',
    precio: 125,
    tallas: ['XS', 'S', 'M', 'L'],
  },
  {
    base: 'Polera a rayas Aware',
    archivo: 'e10YDMWYAyCNAVqxvnD9trN9kDn_preview.webp',
    categoria: 'Poleras',
    coleccion: 'Urbana 2025',
    color: 'Beige',
    temporada: 'Primavera',
    proveedor: 'Import Moda Asia',
    precio: 175,
    tallas: ['S', 'M', 'L'],
  },
  {
    base: 'Vestido camiseta Terracota',
    archivo: 'a0c5e778-1688-11ee-a05c-3908f802058d.webp',
    categoria: 'Vestidos',
    coleccion: 'Urbana 2025',
    color: 'Terracota',
    temporada: 'Verano',
    proveedor: 'Confecciones del Valle',
    precio: 259,
    tallas: ['S', 'M', 'L'],
  },
  {
    base: 'Polera Troy Lee Designs GP Pro',
    archivo:
      'troy-lee-designs-polera-gp-pro-stamp-black-sm-3491903_large.webp',
    categoria: 'Poleras',
    coleccion: 'Deportiva Pro',
    color: 'Negro',
    temporada: 'Todo el ano',
    proveedor: 'Deportex Distribuciones',
    precio: 289,
    tallas: ['M', 'L', 'XL'],
  },
];
