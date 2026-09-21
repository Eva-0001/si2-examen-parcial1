import { dataSourceDeConsola } from '../config/data-source.js';

async function main(): Promise<void> {
  const dataSource = dataSourceDeConsola();
  await dataSource.initialize();

  try {
    const aplicadas = await dataSource.runMigrations({ transaction: 'each' });

    if (aplicadas.length === 0) {
      console.log('No habia migraciones pendientes.');
    } else {
      for (const migracion of aplicadas) {
        console.log(`migracion aplicada: ${migracion.name}`);
      }
    }
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(
    '\nLas migraciones fallaron:\n',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
