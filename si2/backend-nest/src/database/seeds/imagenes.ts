import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import {
  EXTENSIONES_PERMITIDAS,
  URL_PUBLICA_UPLOADS,
} from '../../commons/archivos/archivos.service.js';

const SUBCARPETA = 'productos';

/** Nombre estable y seguro para la URL a partir del archivo original. */
function nombrePublico(archivo: string): string {
  const extension = extname(archivo).toLowerCase();
  const base = archivo
    .slice(0, archivo.length - extension.length)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return `seed-${base}${extension}`;
}

/**
 * Copia las imagenes de `seed/` a la carpeta de uploads y devuelve un mapa
 * `archivo original -> ruta publica` (`/uploads/productos/...`), que es lo que
 * guarda `productos.foto` y lo que el frontend concatena a `VITE_API_URL`.
 *
 * Es idempotente: siempre escribe el mismo nombre de destino.
 */
export async function copiarImagenesDeSeed(): Promise<Map<string, string>> {
  const origen = resolve(process.env.SEED_DIR || 'seed');
  const destino = join(resolve(process.env.UPLOAD_DIR || 'uploads'), SUBCARPETA);
  const rutas = new Map<string, string>();

  let archivos: string[];
  try {
    archivos = await readdir(origen);
  } catch {
    console.warn(
      `sin imagenes: no se pudo leer "${origen}" (los productos quedaran sin foto)`,
    );
    return rutas;
  }

  await mkdir(destino, { recursive: true });

  for (const archivo of archivos) {
    if (!EXTENSIONES_PERMITIDAS.includes(extname(archivo).toLowerCase())) {
      continue;
    }

    const nombre = nombrePublico(archivo);
    await copyFile(join(origen, archivo), join(destino, nombre));
    rutas.set(archivo, `${URL_PUBLICA_UPLOADS}/${SUBCARPETA}/${nombre}`);
  }

  console.log(`imagenes copiadas a uploads/${SUBCARPETA}: ${rutas.size}`);
  return rutas;
}
