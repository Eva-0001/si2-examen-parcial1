import type { MigrationInterface, QueryRunner } from 'typeorm';

// Tablas que la app movil copia a su base local. Cada una recibe
// actualizado_en (mantenida por trigger) y deja rastro en sync_eliminados
// cuando se borra una fila, para que la sincronizacion incremental funcione.
const TABLAS_SINCRONIZADAS = [
  'ciudades',
  'categorias',
  'colecciones',
  'colores',
  'talla',
  'temporadas',
  'sucursales',
  'promociones',
  'productos',
  'producto_sucursal',
  'reserva',
  'ventas',
];

// Tablas hijas cuyo cambio tiene que "tocar" a su padre, porque el movil
// recibe la reserva o la venta completa con sus detalles.
const HIJAS = [
  { tabla: 'reserva_sucursal', padre: 'reserva', columna: 'reserva_id' },
  { tabla: 'detalle_venta', padre: 'ventas', columna: 'venta_id' },
  { tabla: 'comprobantes', padre: 'ventas', columna: 'venta_id' },
];

export class SincronizacionOffline1758000000000 implements MigrationInterface {
  name = 'SincronizacionOffline1758000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE OR REPLACE FUNCTION sync_tocar_actualizado_en() RETURNS trigger AS $$
       BEGIN
         NEW.actualizado_en := now();
         RETURN NEW;
       END
       $$ LANGUAGE plpgsql`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS sync_eliminados (
         id BIGSERIAL PRIMARY KEY,
         tabla VARCHAR(50) NOT NULL,
         registro_id INTEGER NOT NULL,
         usuario_id INTEGER,
         eliminado_en TIMESTAMPTZ NOT NULL DEFAULT now()
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS ix_sync_eliminados_fecha ON sync_eliminados (eliminado_en)`,
    );

    // usuario_id se lee via jsonb porque no todas las tablas tienen esa columna.
    await queryRunner.query(
      `CREATE OR REPLACE FUNCTION sync_registrar_eliminado() RETURNS trigger AS $$
       BEGIN
         INSERT INTO sync_eliminados (tabla, registro_id, usuario_id)
         VALUES (TG_TABLE_NAME, OLD.id, (to_jsonb(OLD) ->> 'usuario_id')::integer);
         RETURN OLD;
       END
       $$ LANGUAGE plpgsql`,
    );

    for (const tabla of TABLAS_SINCRONIZADAS) {
      await queryRunner.query(
        `ALTER TABLE ${tabla}
           ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()`,
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS ix_${tabla}_actualizado_en ON ${tabla} (actualizado_en)`,
      );
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS tr_${tabla}_actualizado_en ON ${tabla}`,
      );
      await queryRunner.query(
        `CREATE TRIGGER tr_${tabla}_actualizado_en
           BEFORE UPDATE ON ${tabla}
           FOR EACH ROW EXECUTE FUNCTION sync_tocar_actualizado_en()`,
      );
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS tr_${tabla}_eliminado ON ${tabla}`,
      );
      await queryRunner.query(
        `CREATE TRIGGER tr_${tabla}_eliminado
           AFTER DELETE ON ${tabla}
           FOR EACH ROW EXECUTE FUNCTION sync_registrar_eliminado()`,
      );
    }

    for (const { tabla, padre, columna } of HIJAS) {
      const funcion = `sync_tocar_${padre}_desde_${tabla}`;
      await queryRunner.query(
        `CREATE OR REPLACE FUNCTION ${funcion}() RETURNS trigger AS $$
         BEGIN
           IF TG_OP = 'DELETE' THEN
             UPDATE ${padre} SET actualizado_en = now() WHERE id = OLD.${columna};
             RETURN OLD;
           END IF;
           UPDATE ${padre} SET actualizado_en = now() WHERE id = NEW.${columna};
           RETURN NEW;
         END
         $$ LANGUAGE plpgsql`,
      );
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS tr_${tabla}_toca_${padre} ON ${tabla}`,
      );
      await queryRunner.query(
        `CREATE TRIGGER tr_${tabla}_toca_${padre}
           AFTER INSERT OR UPDATE OR DELETE ON ${tabla}
           FOR EACH ROW EXECUTE FUNCTION ${funcion}()`,
      );
    }

    await queryRunner.query(
      `ALTER TABLE reserva ADD COLUMN IF NOT EXISTS id_cliente UUID`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS ix_reserva_id_cliente ON reserva (id_cliente)`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS sesiones (
         id UUID PRIMARY KEY,
         usuario_id INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
         token_hash VARCHAR(64) NOT NULL,
         expira_en TIMESTAMPTZ NOT NULL,
         creada_en TIMESTAMPTZ NOT NULL DEFAULT now()
       )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS ix_sesiones_usuario ON sesiones (usuario_id)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS sesiones`);

    await queryRunner.query(`DROP INDEX IF EXISTS ix_reserva_id_cliente`);
    await queryRunner.query(
      `ALTER TABLE reserva DROP COLUMN IF EXISTS id_cliente`,
    );

    for (const { tabla, padre } of HIJAS) {
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS tr_${tabla}_toca_${padre} ON ${tabla}`,
      );
      await queryRunner.query(
        `DROP FUNCTION IF EXISTS sync_tocar_${padre}_desde_${tabla}()`,
      );
    }

    for (const tabla of TABLAS_SINCRONIZADAS) {
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS tr_${tabla}_eliminado ON ${tabla}`,
      );
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS tr_${tabla}_actualizado_en ON ${tabla}`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS ix_${tabla}_actualizado_en`,
      );
      await queryRunner.query(
        `ALTER TABLE ${tabla} DROP COLUMN IF EXISTS actualizado_en`,
      );
    }

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sync_registrar_eliminado()`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS sync_eliminados`);
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sync_tocar_actualizado_en()`,
    );
  }
}
