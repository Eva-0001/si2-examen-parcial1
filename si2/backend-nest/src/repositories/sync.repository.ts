import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Reserva } from '../entities/reserva.entity.js';
import { Venta } from '../entities/venta.entity.js';

// Margen hacia atras del "hasta" que se entrega al cliente. Cubre las
// transacciones que empezaron antes de la consulta pero confirmaron despues:
// sus filas quedan con un actualizado_en anterior al corte. Reenviar unos
// segundos de cambios no hace dano porque el cliente aplica todo como upsert.
const MARGEN_SEGUNDOS = 120;

// Columnas que el movil guarda de cada tabla del catalogo.
export const TABLAS_CATALOGO = {
  ciudades: { tabla: 'ciudades', columnas: 'id, nombre' },
  categorias: { tabla: 'categorias', columnas: 'id, nombre' },
  colecciones: { tabla: 'colecciones', columnas: 'id, nombre, descripcion' },
  colores: { tabla: 'colores', columnas: 'id, nombre' },
  tallas: { tabla: 'talla', columnas: 'id, nombre' },
  temporadas: { tabla: 'temporadas', columnas: 'id, nombre' },
  sucursales: {
    tabla: 'sucursales',
    columnas: 'id, nombre, ubicacion, foto, ciudad_id',
  },
  promociones: {
    tabla: 'promociones',
    columnas:
      'id, nombre, descripcion, fecha_inicio::text AS fecha_inicio, ' +
      'fecha_final::text AS fecha_final, foto, sucursal_id',
  },
  productos: {
    tabla: 'productos',
    columnas:
      'id, nombre, foto, precio, categoria_id, coleccion_id, color_id, ' +
      'talla_id, temporada_id, proveedor_id',
  },
  stock: {
    tabla: 'producto_sucursal',
    columnas:
      'id, cantidad, cantidad_reservada, precio, producto_id, sucursal_id',
  },
} as const;

export type RecursoCatalogo = keyof typeof TABLAS_CATALOGO;

@Injectable()
export class SyncRepository {
  constructor(
    @InjectRepository(Reserva) private readonly reservas: Repository<Reserva>,
    @InjectRepository(Venta) private readonly ventas: Repository<Venta>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async corte(): Promise<Date> {
    const [fila] = await this.dataSource.query(
      `SELECT now() - make_interval(secs => $1) AS hasta`,
      [MARGEN_SEGUNDOS],
    );
    return fila.hasta;
  }

  cambiosDe(
    recurso: RecursoCatalogo,
    desde: string | null,
  ): Promise<Record<string, unknown>[]> {
    const { tabla, columnas } = TABLAS_CATALOGO[recurso];
    return this.dataSource.query(
      `SELECT ${columnas} FROM ${tabla}
        WHERE $1::timestamptz IS NULL OR actualizado_en >= $1::timestamptz
        ORDER BY id`,
      [desde],
    );
  }

  eliminados(
    tablas: string[],
    desde: string,
    usuarioId: number | null = null,
  ): Promise<{ tabla: string; registro_id: number }[]> {
    return this.dataSource.query(
      `SELECT DISTINCT tabla, registro_id FROM sync_eliminados
        WHERE tabla = ANY($1)
          AND eliminado_en >= $2::timestamptz
          AND ($3::integer IS NULL OR usuario_id = $3::integer)`,
      [tablas, desde, usuarioId],
    );
  }

  async idsCambiados(
    tabla: 'reserva' | 'ventas',
    usuarioId: number,
    desde: string | null,
  ): Promise<number[]> {
    const filas: { id: number }[] = await this.dataSource.query(
      `SELECT id FROM ${tabla}
        WHERE usuario_id = $1
          AND ($2::timestamptz IS NULL OR actualizado_en >= $2::timestamptz)`,
      [usuarioId, desde],
    );
    return filas.map((fila) => fila.id);
  }

  reservasCompletas(ids: number[]): Promise<Reserva[]> {
    if (ids.length === 0) return Promise.resolve([]);

    return this.reservas.find({
      where: { id: In(ids) },
      relations: {
        detalles: { producto_sucursal: { producto: true, sucursal: true } },
      },
      order: { id: 'ASC', detalles: { id: 'ASC' } },
    });
  }

  ventasCompletas(ids: number[]): Promise<Venta[]> {
    if (ids.length === 0) return Promise.resolve([]);

    return this.ventas.find({
      where: { id: In(ids) },
      relations: {
        comprobantes: true,
        detalles: { producto_sucursal: { producto: true, sucursal: true } },
      },
      order: { id: 'ASC', detalles: { id: 'ASC' } },
    });
  }
}
