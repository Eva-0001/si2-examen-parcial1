import { DataSource, type DataSourceOptions } from 'typeorm';
import { MIGRACIONES } from '../database/migrations/index.js';
import { ENTIDADES } from '../entities/index.js';

export function opcionesDeDataSource(
  url: string,
  enProduccion = false,
): DataSourceOptions {
  return {
    type: 'postgres',
    url,
    entities: ENTIDADES,
    migrations: MIGRACIONES,
    synchronize: false,
    migrationsRun: false,
    logging: enProduccion ? ['error'] : ['error', 'warn', 'migration'],
  };
}

export function cargarEnv(): void {
  try {
    process.loadEnvFile('.env');
  } catch {}
}

export function dataSourceDeConsola(): DataSource {
  cargarEnv();

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL no esta definida. Copia .env.example a .env y completala antes de migrar.',
    );
  }

  return new DataSource(
    opcionesDeDataSource(url, process.env.NODE_ENV === 'production'),
  );
}
