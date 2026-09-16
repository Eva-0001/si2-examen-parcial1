import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EntityManager } from 'typeorm';
import { Rol } from '../commons/enums/rol.enum.js';
import type { Configuracion } from '../config/configuracion.js';
import type {
  ActualizarReservaDto,
  CrearReservaDto,
  DetalleDeReservaDto,
  FiltroReservasDto,
} from '../dto/reserva.dto.js';
import { ProductoSucursal } from '../entities/producto-sucursal.entity.js';
import { Reserva } from '../entities/reserva.entity.js';
import { ReservaSucursal } from '../entities/reserva-sucursal.entity.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { ReservasRepository } from '../repositories/reservas.repository.js';
import { BitacoraService } from './bitacora.service.js';

const NO_ENCONTRADA = 'Reserva no encontrada';

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name);
  private readonly horasVigencia: number;

  constructor(
    private readonly repo: ReservasRepository,
    private readonly bitacora: BitacoraService,
    config: ConfigService<Configuracion, true>,
  ) {
    this.horasVigencia = config.get('reservas', { infer: true }).horasVigencia;
  }

  async listar(filtro: FiltroReservasDto, actor: Usuario): Promise<Reserva[]> {
    await this.liberarVencidas();

    const usuarioId = this.esCliente(actor) ? actor.id : filtro.usuario_id;
    return this.repo.listar(usuarioId, filtro.asistencia, filtro.sucursal_id);
  }

  async obtener(id: number, actor: Usuario): Promise<Reserva> {
    const reserva = await this.repo.obtenerCompleta(id);
    if (!reserva) throw new NotFoundException(NO_ENCONTRADA);

    if (this.esCliente(actor) && reserva.usuario_id !== actor.id) {
      throw new ForbiddenException('Esa reserva no es tuya');
    }

    return reserva;
  }

  async crear(datos: CrearReservaDto, actor: Usuario): Promise<Reserva> {
    await this.liberarVencidas();

    const usuarioId = this.esCliente(actor) ? actor.id : datos.usuario_id;

    if (!(await this.repo.existeUsuario(usuarioId))) {
      throw new BadRequestException('El usuario no existe');
    }
    this.verificarFecha(datos.fecha);

    const reserva = await this.repo.transaccion(async (manager) => {
      const pedido = this.agruparPorStock(datos.detalles);
      const stocks = await this.bloquearYValidar(manager, pedido);
      const sucursalId = this.sucursalUnica(stocks);

      const reserva = await manager.getRepository(Reserva).save(
        manager.getRepository(Reserva).create({
          fecha: datos.fecha,
          hora: datos.hora,
          usuario_id: usuarioId,
          sucursal_id: sucursalId,
          asistencia: false,
          stock_liberado: false,
        }),
      );

      for (const [stockId, cantidad] of pedido) {
        const stock = stocks.get(stockId)!;

        await manager.getRepository(ReservaSucursal).save(
          manager.getRepository(ReservaSucursal).create({
            reserva_id: reserva.id,
            producto_sucursal_id: stock.id,
            cantidad,
          }),
        );

        stock.cantidad_reservada += cantidad;
        await manager.getRepository(ProductoSucursal).save(stock);

        await this.bitacora.registrar(
          manager,
          actor,
          `Reserva #${reserva.id}: ${cantidad} unidad(es) apartadas`,
          stock.producto?.nombre ?? null,
        );
      }

      return reserva;
    });

    return (await this.repo.obtenerCompleta(reserva.id)) ?? reserva;
  }

  async actualizar(
    id: number,
    datos: ActualizarReservaDto,
    actor: Usuario,
  ): Promise<Reserva> {
    if (datos.fecha !== undefined) this.verificarFecha(datos.fecha);

    await this.repo.transaccion(async (manager) => {
      const reserva = await manager.getRepository(Reserva).findOne({
        where: { id },
        relations: { detalles: true },
      });
      if (!reserva) throw new NotFoundException(NO_ENCONTRADA);

      if (datos.asistencia === true && !reserva.stock_liberado) {
        await this.liberarApartado(manager, reserva, actor, 'atendida');
      }

      Object.assign(reserva, datos);
      await manager.getRepository(Reserva).save(reserva);
    });

    return (await this.repo.obtenerCompleta(id))!;
  }

  async eliminar(id: number, actor: Usuario): Promise<{ mensaje: string }> {
    await this.repo.transaccion(async (manager) => {
      const reserva = await manager.getRepository(Reserva).findOne({
        where: { id },
        relations: { detalles: true },
      });
      if (!reserva) throw new NotFoundException(NO_ENCONTRADA);

      if (this.esCliente(actor) && reserva.usuario_id !== actor.id) {
        throw new ForbiddenException('Esa reserva no es tuya');
      }

      if (!reserva.stock_liberado) {
        await this.liberarApartado(manager, reserva, actor, 'cancelada');
      }

      await manager.getRepository(Reserva).delete({ id });
    });

    return { mensaje: 'Reserva cancelada' };
  }

  async liberarVencidas(): Promise<number> {
    return this.repo.transaccion(async (manager) => {
      const vencidas = await this.repo.vencidas(manager, this.horasVigencia);
      if (vencidas.length === 0) return 0;

      for (const reserva of vencidas) {
        await this.liberarApartado(manager, reserva, null, 'vencida');
        reserva.stock_liberado = true;
        await manager.getRepository(Reserva).save(reserva);
      }

      this.logger.log(`Se liberaron ${vencidas.length} reserva(s) vencida(s)`);
      return vencidas.length;
    });
  }

  private async liberarApartado(
    manager: EntityManager,
    reserva: Reserva,
    actor: Usuario | null,
    motivo: string,
  ): Promise<void> {
    const detalles = reserva.detalles ?? [];
    const ids = [
      ...new Set(detalles.map((detalle) => detalle.producto_sucursal_id)),
    ];
    const stocks = new Map(
      (await this.repo.bloquearStock(manager, ids)).map((stock) => [
        stock.id,
        stock,
      ]),
    );

    for (const detalle of detalles) {
      const stock = stocks.get(detalle.producto_sucursal_id);
      if (!stock) continue;

      stock.cantidad_reservada = Math.max(
        0,
        stock.cantidad_reservada - detalle.cantidad,
      );
      await manager.getRepository(ProductoSucursal).save(stock);

      if (actor) {
        await this.bitacora.registrar(
          manager,
          actor,
          `Reserva #${reserva.id} ${motivo}: ${detalle.cantidad} unidad(es) liberadas`,
          stock.producto?.nombre ?? null,
        );
      }
    }

    reserva.stock_liberado = true;
  }

  private async bloquearYValidar(
    manager: EntityManager,
    pedido: Map<number, number>,
  ): Promise<Map<number, ProductoSucursal>> {
    const ids = [...pedido.keys()];
    const filas = await this.repo.bloquearStock(manager, ids);
    const stocks = new Map(filas.map((stock) => [stock.id, stock]));

    for (const [stockId, cantidad] of pedido) {
      const stock = stocks.get(stockId);
      if (!stock)
        throw new BadRequestException(`No existe el stock ${stockId}`);

      const disponible = stock.cantidad - stock.cantidad_reservada;
      if (disponible < cantidad) {
        throw new ConflictException(
          `Stock insuficiente para el producto ${stock.producto_id}: ` +
            `quedan ${disponible}, se reservan ${cantidad}`,
        );
      }
    }

    const conProducto = await manager.getRepository(ProductoSucursal).find({
      where: ids.map((id) => ({ id })),
      relations: { producto: true },
    });
    for (const fila of conProducto) {
      const stock = stocks.get(fila.id);
      if (stock) stock.producto = fila.producto;
    }

    return stocks;
  }

  private sucursalUnica(stocks: Map<number, ProductoSucursal>): number {
    const sucursales = new Set(
      [...stocks.values()].map((stock) => stock.sucursal_id),
    );

    if (sucursales.size > 1) {
      throw new BadRequestException(
        'Todas las prendas de una reserva tienen que ser de la misma sucursal',
      );
    }

    return [...sucursales][0];
  }

  private verificarFecha(fecha: string): void {
    const hoy = new Date();
    const fechaDeHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    if (fecha < fechaDeHoy) {
      throw new BadRequestException(
        'No se puede reservar para una fecha que ya paso',
      );
    }
  }

  private agruparPorStock(
    detalles: DetalleDeReservaDto[],
  ): Map<number, number> {
    const pedido = new Map<number, number>();
    for (const linea of detalles) {
      pedido.set(
        linea.producto_sucursal_id,
        (pedido.get(linea.producto_sucursal_id) ?? 0) + linea.cantidad,
      );
    }
    return pedido;
  }

  private esCliente(usuario: Usuario): boolean {
    return usuario.rol?.nombre === Rol.CLIENTE;
  }
}
