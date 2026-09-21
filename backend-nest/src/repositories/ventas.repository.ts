import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, In, Repository } from 'typeorm';
import { ProductoSucursal } from '../entities/producto-sucursal.entity.js';
import { Usuario } from '../entities/usuario.entity.js';
import { Venta } from '../entities/venta.entity.js';
import type { TipoVenta } from '../commons/enums/tipo-venta.enum.js';

@Injectable()
export class VentasRepository {
  constructor(
    @InjectRepository(Venta) private readonly ventas: Repository<Venta>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(ProductoSucursal)
    private readonly stock: Repository<ProductoSucursal>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  listar(usuarioId?: number, tipoVenta?: TipoVenta): Promise<Venta[]> {
    const consulta = this.ventas.createQueryBuilder('venta');

    if (usuarioId !== undefined) {
      consulta.andWhere('venta.usuario_id = :usuarioId', { usuarioId });
    }
    if (tipoVenta !== undefined) {
      consulta.andWhere('venta.tipo_venta = :tipoVenta', { tipoVenta });
    }

    return consulta.orderBy('venta.id', 'DESC').getMany();
  }

  obtener(id: number): Promise<Venta | null> {
    return this.ventas.findOne({ where: { id } });
  }

  obtenerCompleta(id: number): Promise<Venta | null> {
    return this.ventas.findOne({
      where: { id },
      relations: {
        usuario: true,
        comprobantes: true,
        detalles: { producto_sucursal: { producto: true, sucursal: true } },
      },
      order: { detalles: { id: 'ASC' } },
    });
  }

  existeUsuario(usuarioId: number): Promise<boolean> {
    return this.usuarios.existsBy({ id: usuarioId });
  }

  pagoYaUsado(pagoId: string): Promise<boolean> {
    return this.ventas.existsBy({ pago_id: pagoId });
  }

  stockPorIds(ids: number[]): Promise<ProductoSucursal[]> {
    return this.stock.find({ where: { id: In(ids) } });
  }

  bloquearStock(
    manager: EntityManager,
    ids: number[],
  ): Promise<ProductoSucursal[]> {
    return manager
      .createQueryBuilder(ProductoSucursal, 'stock')
      .setLock('pessimistic_write')
      .where('stock.id IN (:...ids)', { ids })
      .orderBy('stock.id', 'ASC')
      .getMany();
  }

  transaccion<T>(
    operacion: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(operacion);
  }

  guardar(venta: Venta): Promise<Venta> {
    return this.ventas.save(venta);
  }
}
