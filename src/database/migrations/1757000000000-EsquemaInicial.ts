import type { MigrationInterface, QueryRunner } from 'typeorm';

export class EsquemaInicial1757000000000 implements MigrationInterface {
  name = 'EsquemaInicial1757000000000';

  private readonly sentencias: string[] = [
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'genero_enum') THEN
         CREATE TYPE genero_enum AS ENUM ('masculino', 'femenino');
       END IF;
     END $$`,
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_venta_enum') THEN
         CREATE TYPE tipo_venta_enum AS ENUM ('virtual', 'presencial');
       END IF;
     END $$`,

    `CREATE TABLE IF NOT EXISTS roles (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(50) NOT NULL UNIQUE
     )`,
    `CREATE TABLE IF NOT EXISTS ciudades (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(100) NOT NULL UNIQUE
     )`,
    `CREATE TABLE IF NOT EXISTS categorias (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(100) NOT NULL UNIQUE
     )`,
    `CREATE TABLE IF NOT EXISTS colecciones (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(100) NOT NULL UNIQUE,
       descripcion TEXT
     )`,
    `CREATE TABLE IF NOT EXISTS colores (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(50) NOT NULL UNIQUE
     )`,
    `CREATE TABLE IF NOT EXISTS talla (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(20) NOT NULL UNIQUE
     )`,
    `CREATE TABLE IF NOT EXISTS temporadas (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(50) NOT NULL UNIQUE
     )`,
    `CREATE TABLE IF NOT EXISTS proveedores (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(150) NOT NULL,
       descripcion TEXT,
       encargado VARCHAR(150),
       telefono VARCHAR(20)
     )`,

    `CREATE TABLE IF NOT EXISTS usuarios (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(100) NOT NULL,
       apellido VARCHAR(100) NOT NULL,
       correo VARCHAR(150) NOT NULL,
       username VARCHAR(50) NOT NULL,
       password VARCHAR(255) NOT NULL,
       genero genero_enum,
       rol_id INTEGER NOT NULL REFERENCES roles (id),
       tipo VARCHAR(20) NOT NULL DEFAULT 'usuario'
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ix_usuarios_correo ON usuarios (correo)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ix_usuarios_username ON usuarios (username)`,

    `CREATE TABLE IF NOT EXISTS sucursales (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(100) NOT NULL,
       ubicacion VARCHAR(255),
       foto VARCHAR(255),
       ciudad_id INTEGER NOT NULL REFERENCES ciudades (id)
     )`,

    `CREATE TABLE IF NOT EXISTS trabajador (
       id INTEGER PRIMARY KEY REFERENCES usuarios (id) ON DELETE CASCADE,
       codigo VARCHAR(50) NOT NULL,
       fecha_contrato DATE NOT NULL,
       sueldo NUMERIC(10, 2) NOT NULL,
       sucursal_id INTEGER REFERENCES sucursales (id)
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ix_trabajador_codigo ON trabajador (codigo)`,

    `CREATE TABLE IF NOT EXISTS promociones (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(100) NOT NULL,
       descripcion TEXT,
       fecha_inicio DATE NOT NULL,
       fecha_final DATE NOT NULL,
       foto VARCHAR(255),
       sucursal_id INTEGER NOT NULL REFERENCES sucursales (id) ON DELETE CASCADE
     )`,

    `CREATE TABLE IF NOT EXISTS productos (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(150) NOT NULL,
       foto VARCHAR(255),
       precio NUMERIC(10, 2) NOT NULL,
       categoria_id INTEGER REFERENCES categorias (id),
       coleccion_id INTEGER REFERENCES colecciones (id),
       color_id INTEGER REFERENCES colores (id),
       talla_id INTEGER REFERENCES talla (id),
       temporada_id INTEGER REFERENCES temporadas (id),
       proveedor_id INTEGER REFERENCES proveedores (id)
     )`,

    `CREATE TABLE IF NOT EXISTS producto_sucursal (
       id SERIAL PRIMARY KEY,
       cantidad INTEGER NOT NULL DEFAULT 0,
       precio NUMERIC(10, 2) NOT NULL,
       producto_id INTEGER NOT NULL REFERENCES productos (id) ON DELETE CASCADE,
       sucursal_id INTEGER NOT NULL REFERENCES sucursales (id) ON DELETE CASCADE,
       cantidad_reservada INTEGER NOT NULL DEFAULT 0,
       CONSTRAINT uq_producto_sucursal UNIQUE (producto_id, sucursal_id),
       CONSTRAINT ck_producto_sucursal_cantidad CHECK (cantidad >= 0),
       CONSTRAINT ck_producto_sucursal_reservada
         CHECK (cantidad_reservada >= 0 AND cantidad_reservada <= cantidad)
     )`,
    `CREATE INDEX IF NOT EXISTS ix_producto_sucursal_producto ON producto_sucursal (producto_id)`,
    `CREATE INDEX IF NOT EXISTS ix_producto_sucursal_sucursal ON producto_sucursal (sucursal_id)`,

    `CREATE TABLE IF NOT EXISTS ventas (
       id SERIAL PRIMARY KEY,
       tipo_venta tipo_venta_enum NOT NULL,
       total NUMERIC(10, 2) NOT NULL DEFAULT 0,
       usuario_id INTEGER NOT NULL REFERENCES usuarios (id),
       pago_id VARCHAR(255),
       creada_en TIMESTAMP NOT NULL DEFAULT now()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ix_ventas_pago_id ON ventas (pago_id)`,
    `CREATE INDEX IF NOT EXISTS ix_ventas_creada_en ON ventas (creada_en)`,

    `CREATE TABLE IF NOT EXISTS detalle_venta (
       id SERIAL PRIMARY KEY,
       cantidad INTEGER NOT NULL DEFAULT 1,
       precio NUMERIC(10, 2) NOT NULL,
       venta_id INTEGER NOT NULL REFERENCES ventas (id) ON DELETE CASCADE,
       producto_sucursal_id INTEGER NOT NULL REFERENCES producto_sucursal (id)
     )`,
    `CREATE INDEX IF NOT EXISTS ix_detalle_venta_venta ON detalle_venta (venta_id)`,

    `CREATE TABLE IF NOT EXISTS comprobantes (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(150) NOT NULL,
       cantidad INTEGER NOT NULL DEFAULT 1,
       monto NUMERIC(10, 2) NOT NULL,
       fecha TIMESTAMP NOT NULL DEFAULT now(),
       venta_id INTEGER NOT NULL REFERENCES ventas (id) ON DELETE CASCADE
     )`,

    `CREATE TABLE IF NOT EXISTS reserva (
       id SERIAL PRIMARY KEY,
       fecha DATE NOT NULL,
       hora TIME NOT NULL,
       asistencia BOOLEAN NOT NULL DEFAULT FALSE,
       usuario_id INTEGER NOT NULL REFERENCES usuarios (id),
       sucursal_id INTEGER REFERENCES sucursales (id),
       stock_liberado BOOLEAN NOT NULL DEFAULT FALSE
     )`,
    `CREATE INDEX IF NOT EXISTS ix_reserva_sucursal ON reserva (sucursal_id)`,

    `CREATE TABLE IF NOT EXISTS reserva_sucursal (
       id SERIAL PRIMARY KEY,
       cantidad INTEGER NOT NULL DEFAULT 1,
       reserva_id INTEGER NOT NULL REFERENCES reserva (id) ON DELETE CASCADE,
       producto_sucursal_id INTEGER NOT NULL REFERENCES producto_sucursal (id)
     )`,

    `CREATE TABLE IF NOT EXISTS bitacora (
       id SERIAL PRIMARY KEY,
       accion VARCHAR(255) NOT NULL,
       encargado VARCHAR(150) NOT NULL,
       producto VARCHAR(150),
       fecha TIMESTAMP NOT NULL DEFAULT now(),
       actor_id INTEGER
     )`,
    `CREATE INDEX IF NOT EXISTS ix_bitacora_fecha ON bitacora (fecha)`,
    `CREATE INDEX IF NOT EXISTS ix_bitacora_encargado ON bitacora (encargado)`,
    `CREATE INDEX IF NOT EXISTS ix_bitacora_actor ON bitacora (actor_id)`,
  ];

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const sentencia of this.sentencias) {
      await queryRunner.query(sentencia);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tablas = [
      'bitacora',
      'reserva_sucursal',
      'reserva',
      'comprobantes',
      'detalle_venta',
      'ventas',
      'producto_sucursal',
      'productos',
      'promociones',
      'trabajador',
      'sucursales',
      'usuarios',
      'proveedores',
      'temporadas',
      'talla',
      'colores',
      'colecciones',
      'categorias',
      'ciudades',
      'roles',
    ];

    for (const tabla of tablas) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${tabla} CASCADE`);
    }
    await queryRunner.query('DROP TYPE IF EXISTS tipo_venta_enum');
    await queryRunner.query('DROP TYPE IF EXISTS genero_enum');
  }
}
