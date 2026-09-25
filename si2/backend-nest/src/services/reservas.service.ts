import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type EntityManager, QueryFailedError } from 'typeorm';
import { Rol } from '../commons/enums/rol.enum.js';
import { CodigoError, errorDeNegocio } from '../commons/errores.js';
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
const VIOLACION_DE_UNICIDAD = '23505';
const MINUTOS_ENTRE_LIMPIEZAS = 15;

@Injectable()
export class ReservasService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReservasService.name);
  private readonly horasVigencia: number;
  private limpieza: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly repo: ReservasRepository,
    private readonly bitacora: BitacoraService,
    config: ConfigService<Configuracion, true>,
  ) {
    this.horasVigencia = config.get('reservas', { infer: true }).horasVigencia;
  }

  onModuleInit(): void {
    this.limpieza = setInterval(() => {
      this.liberarVencidas().catch((error: unknown) =>
        this.logger.error('No se pudieron liberar las reservas vencidas', error),
      );
    }, MINUTOS_ENTRE_LIMPIEZAS * 60_000);
  }

  onModuleDestroy(): void {
    if (this.limpieza) clearInterval(this.limpieza);
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

    const repetida = await this.yaCreada(datos.id_cliente, usuarioId);
    if (repetida) return repetida;

    if (!(await this.repo.existeUsuario(usuarioId))) {
      throw errorDeNegocio(
        BadRequestException,
        CodigoError.USUARIO_INEXISTENTE,
        'El usuario no existe',
      );
    }
    this.verificarFecha(datos.fecha);

    let reserva: Reserva;
    try {
      reserva = await this.guardarNueva(datos, usuarioId, actor);
    } catch (error) {
      const repetida = this.esDuplicada(error)
        ? await this.yaCreada(datos.id_cliente, usuarioId)
        : null;
      if (repetida) return repetida;
      throw error;
    }

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

  private async yaCreada(
    idCliente: string | undefined,
    usuarioId: number,
  ): Promise<Reserva | null> {
    if (!idCliente) return null;

    const existente = await this.repo.porIdCliente(idCliente);
    if (!existente) return null;

    if (existente.usuario_id !== usuarioId) {
      throw new ConflictException('Ese id_cliente ya pertenece a otra reserva');
    }

    return (await this.repo.obtenerCompleta(existente.id)) ?? existente;
  }

  private esDuplicada(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string } | undefined)?.code ===
        VIOLACION_DE_UNICIDAD
    );
  }

  private guardarNueva(
    datos: CrearReservaDto,
    usuarioId: number,
    actor: Usuario,
  ): Promise<Reserva> {
    return this.repo.transaccion(async (manager) => {
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
          id_cliente: datos.id_cliente ?? null,
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
        throw errorDeNegocio(
          BadRequestException,
          CodigoError.STOCK_INEXISTENTE,
          `No existe el stock ${stockId}`,
        );

      const disponible = stock.cantidad - stock.cantidad_reservada;
      if (disponible < cantidad) {
        throw errorDeNegocio(
          ConflictException,
          CodigoError.SIN_STOCK,
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
      throw errorDeNegocio(
        BadRequestException,
        CodigoError.SUCURSALES_MEZCLADAS,
        'Todas las prendas de una reserva tienen que ser de la misma sucursal',
      );
    }

    return [...sucursales][0];
  }

  private verificarFecha(fecha: string): void {
    const hoy = new Date();
    const fechaDeHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    if (fecha < fechaDeHoy) {
      throw errorDeNegocio(
        BadRequestException,
        CodigoError.FECHA_INVALIDA,
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
