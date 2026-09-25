import { dataSourceDeConsola } from '../config/data-source.js';

async function main(): Promise<void> {
  const dataSource = dataSourceDeConsola();
  await dataSource.initialize();

  try {
    await dataSource.undoLastMigration({ transaction: 'each' });
    console.log('Se revirtio la ultima migracion.');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(
    '\nNo se pudo revertir:\n',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
