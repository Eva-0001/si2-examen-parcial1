import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, In, Repository } from 'typeorm';
import { ProductoSucursal } from '../entities/producto-sucursal.entity.js';
import { Reserva } from '../entities/reserva.entity.js';
import { Usuario } from '../entities/usuario.entity.js';

@Injectable()
export class ReservasRepository {
  constructor(
    @InjectRepository(Reserva) private readonly reservas: Repository<Reserva>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(ProductoSucursal)
    private readonly stock: Repository<ProductoSucursal>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  listar(
    usuarioId?: number,
    asistencia?: boolean,
    sucursalId?: number,
  ): Promise<Reserva[]> {
    const consulta = this.reservas.createQueryBuilder('reserva');

    if (usuarioId !== undefined) {
      consulta.andWhere('reserva.usuario_id = :usuarioId', { usuarioId });
    }
    if (asistencia !== undefined) {
      consulta.andWhere('reserva.asistencia = :asistencia', { asistencia });
    }
    if (sucursalId !== undefined) {
      consulta.andWhere('reserva.sucursal_id = :sucursalId', { sucursalId });
    }

    return consulta
      .orderBy('reserva.fecha', 'DESC')
      .addOrderBy('reserva.hora', 'ASC')
      .getMany();
  }

  obtener(id: number): Promise<Reserva | null> {
    return this.reservas.findOne({ where: { id } });
  }

  obtenerCompleta(id: number): Promise<Reserva | null> {
    return this.reservas.findOne({
      where: { id },
      relations: {
        usuario: true,
        detalles: { producto_sucursal: { producto: true, sucursal: true } },
      },
      order: { detalles: { id: 'ASC' } },
    });
  }

  porIdCliente(idCliente: string): Promise<Reserva | null> {
    return this.reservas.findOne({ where: { id_cliente: idCliente } });
  }

  existeUsuario(usuarioId: number): Promise<boolean> {
    return this.usuarios.existsBy({ id: usuarioId });
  }

  stockPorIds(ids: number[]): Promise<ProductoSucursal[]> {
    return this.stock.find({
      where: { id: In(ids) },
      relations: { producto: true },
    });
  }

  bloquearStock(
    manager: EntityManager,
    ids: number[],
  ): Promise<ProductoSucursal[]> {
    if (ids.length === 0) return Promise.resolve([]);

    return manager
      .createQueryBuilder(ProductoSucursal, 'stock')
      .setLock('pessimistic_write')
      .where('stock.id IN (:...ids)', { ids })
      .orderBy('stock.id', 'ASC')
      .getMany();
  }

  vencidas(manager: EntityManager, horas: number): Promise<Reserva[]> {
    return manager
      .createQueryBuilder(Reserva, 'reserva')
      .leftJoinAndSelect('reserva.detalles', 'detalle')
      .where('reserva.stock_liberado = false')
      .andWhere(
        '(reserva.fecha + reserva.hora) + make_interval(hours => :horas) < now()',
        { horas },
      )
      .getMany();
  }

  transaccion<T>(
    operacion: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(operacion);
  }
}
