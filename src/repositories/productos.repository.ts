import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Categoria } from '../entities/categoria.entity.js';
import { Coleccion } from '../entities/coleccion.entity.js';
import { Color } from '../entities/color.entity.js';
import { DetalleVenta } from '../entities/detalle-venta.entity.js';
import { Producto } from '../entities/producto.entity.js';
import { ProductoSucursal } from '../entities/producto-sucursal.entity.js';
import { Proveedor } from '../entities/proveedor.entity.js';
import { ReservaSucursal } from '../entities/reserva-sucursal.entity.js';
import { Sucursal } from '../entities/sucursal.entity.js';
import { Talla } from '../entities/talla.entity.js';
import { Temporada } from '../entities/temporada.entity.js';

export interface FiltroDeProductos {
  nombre?: string;
  categoria_id?: number;
  coleccion_id?: number;
  color_id?: number;
  talla_id?: number;
  temporada_id?: number;
}

const CATALOGOS = [
  ['categoria_id', Categoria, 'La categoria no existe'],
  ['coleccion_id', Coleccion, 'La coleccion no existe'],
  ['color_id', Color, 'El color no existe'],
  ['talla_id', Talla, 'La talla no existe'],
  ['temporada_id', Temporada, 'La temporada no existe'],
  ['proveedor_id', Proveedor, 'El proveedor no existe'],
] as const;

@Injectable()
export class ProductosRepository {
  constructor(
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
    @InjectRepository(ProductoSucursal)
    private readonly stock: Repository<ProductoSucursal>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  listar(filtro: FiltroDeProductos): Promise<Producto[]> {
    const consulta = this.productos.createQueryBuilder('producto');

    if (filtro.nombre) {
      consulta.andWhere('producto.nombre ILIKE :nombre', {
        nombre: `%${filtro.nombre}%`,
      });
    }
    for (const campo of [
      'categoria_id',
      'coleccion_id',
      'color_id',
      'talla_id',
      'temporada_id',
    ] as const) {
      const valor = filtro[campo];
      if (valor !== undefined) {
        consulta.andWhere(`producto.${campo} = :${campo}`, { [campo]: valor });
      }
    }

    return consulta.orderBy('producto.nombre', 'ASC').getMany();
  }

  obtener(id: number): Promise<Producto | null> {
    return this.productos.findOne({ where: { id } });
  }

  obtenerCompleto(id: number): Promise<Producto | null> {
    return this.productos.findOne({
      where: { id },
      relations: {
        categoria: true,
        coleccion: true,
        color: true,
        talla: true,
        temporada: true,
        proveedor: true,
      },
    });
  }

  async catalogoInvalido(
    campos: Record<string, unknown>,
  ): Promise<string | null> {
    for (const [campo, entidad, mensaje] of CATALOGOS) {
      const valor = campos[campo];
      if (valor === undefined || valor === null) continue;

      const existe = await this.dataSource
        .getRepository(entidad)
        .existsBy({ id: valor as number });
      if (!existe) return mensaje;
    }
    return null;
  }

  tieneStock(id: number): Promise<boolean> {
    return this.stock.existsBy({ producto_id: id });
  }

  crear(datos: Partial<Producto>): Promise<Producto> {
    return this.productos.save(this.productos.create(datos));
  }

  guardar(producto: Producto): Promise<Producto> {
    return this.productos.save(producto);
  }

  async eliminar(id: number): Promise<void> {
    await this.productos.delete(id);
  }
}

@Injectable()
export class StockRepository {
  constructor(
    @InjectRepository(ProductoSucursal)
    private readonly stock: Repository<ProductoSucursal>,
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
    @InjectRepository(Sucursal)
    private readonly sucursales: Repository<Sucursal>,
    @InjectRepository(DetalleVenta)
    private readonly detalles: Repository<DetalleVenta>,
    @InjectRepository(ReservaSucursal)
    private readonly reservados: Repository<ReservaSucursal>,
  ) {}

  listar(
    productoId?: number,
    sucursalId?: number,
    soloDisponibles = false,
  ): Promise<ProductoSucursal[]> {
    const consulta = this.stock
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.producto', 'producto')
      .leftJoinAndSelect('stock.sucursal', 'sucursal');

    if (productoId !== undefined) {
      consulta.andWhere('stock.producto_id = :productoId', { productoId });
    }
    if (sucursalId !== undefined) {
      consulta.andWhere('stock.sucursal_id = :sucursalId', { sucursalId });
    }
    if (soloDisponibles) {
      consulta.andWhere('stock.cantidad - stock.cantidad_reservada > 0');
    }

    return consulta.orderBy('stock.id', 'ASC').getMany();
  }

  obtener(id: number): Promise<ProductoSucursal | null> {
    return this.stock.findOne({ where: { id } });
  }

  obtenerCompleto(id: number): Promise<ProductoSucursal | null> {
    return this.stock.findOne({
      where: { id },
      relations: { producto: true, sucursal: true },
    });
  }

  existeProducto(productoId: number): Promise<boolean> {
    return this.productos.existsBy({ id: productoId });
  }

  existeSucursal(sucursalId: number): Promise<boolean> {
    return this.sucursales.existsBy({ id: sucursalId });
  }

  yaCargado(productoId: number, sucursalId: number): Promise<boolean> {
    return this.stock.existsBy({
      producto_id: productoId,
      sucursal_id: sucursalId,
    });
  }

  async tieneMovimientos(id: number): Promise<boolean> {
    const [conVentas, conReservas] = await Promise.all([
      this.detalles.existsBy({ producto_sucursal_id: id }),
      this.reservados.existsBy({ producto_sucursal_id: id }),
    ]);
    return conVentas || conReservas;
  }

  crear(datos: Partial<ProductoSucursal>): Promise<ProductoSucursal> {
    return this.stock.save(this.stock.create(datos));
  }

  guardar(registro: ProductoSucursal): Promise<ProductoSucursal> {
    return this.stock.save(registro);
  }

  async eliminar(id: number): Promise<void> {
    await this.stock.delete(id);
  }
}
