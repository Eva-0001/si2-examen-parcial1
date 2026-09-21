import type {
  DeepPartial,
  EntityManager,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';

/**
 * Generador pseudoaleatorio determinista (mulberry32): con la misma semilla el
 * seed produce siempre la misma tienda, asi las capturas y los reportes de la
 * defensa no cambian entre maquinas.
 */
export function generador(semilla: number): () => number {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function entero(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function elegir<T>(rng: () => number, lista: readonly T[]): T {
  return lista[Math.floor(rng() * lista.length)];
}

/** Devuelve `cuantos` elementos distintos de `lista`. */
export function elegirVarios<T>(
  rng: () => number,
  lista: readonly T[],
  cuantos: number,
): T[] {
  const copia = [...lista];
  const elegidos: T[] = [];
  const total = Math.min(cuantos, copia.length);

  for (let i = 0; i < total; i++) {
    elegidos.push(copia.splice(Math.floor(rng() * copia.length), 1)[0]);
  }

  return elegidos;
}

export function sumarDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

/** `YYYY-MM-DD` en hora local (las columnas DATE no llevan zona). */
export function comoFecha(fecha: Date): string {
  const cero = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${cero(fecha.getMonth() + 1)}-${cero(fecha.getDate())}`;
}

export function comoHora(horas: number, minutos: number): string {
  const cero = (n: number) => String(n).padStart(2, '0');
  return `${cero(horas)}:${cero(minutos)}:00`;
}

export function comoMonto(valor: number): string {
  return (Math.round(valor * 100) / 100).toFixed(2);
}

/**
 * Busca una fila por sus campos unicos y la crea solo si falta. Es lo que hace
 * al seed re-ejecutable: el entrypoint de Docker lo corre en cada arranque.
 */
export async function asegurar<T extends ObjectLiteral>(
  manager: EntityManager,
  entidad: new () => T,
  busqueda: FindOptionsWhere<T>,
  datos: DeepPartial<T>,
): Promise<T> {
  const repo = manager.getRepository(entidad);
  const existente = await repo.findOne({ where: busqueda });
  if (existente) return existente;

  return repo.save(repo.create(datos));
}

/** Crea cada fila de `nombres` y devuelve un mapa nombre -> id. */
export async function asegurarPorNombre<
  T extends ObjectLiteral & { id: number; nombre: string },
>(
  manager: EntityManager,
  entidad: new () => T,
  nombres: readonly string[],
): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();

  for (const nombre of nombres) {
    const fila = await asegurar(
      manager,
      entidad,
      { nombre } as unknown as FindOptionsWhere<T>,
      { nombre } as unknown as DeepPartial<T>,
    );
    mapa.set(nombre, fila.id);
  }

  return mapa;
}

/** Lee el mapa fallando con un mensaje claro si el dato no fue sembrado. */
export function idDe(mapa: Map<string, number>, clave: string): number {
  const id = mapa.get(clave);
  if (id === undefined) {
    throw new Error(`El seed referencia "${clave}" pero no fue creado antes`);
  }
  return id;
}
