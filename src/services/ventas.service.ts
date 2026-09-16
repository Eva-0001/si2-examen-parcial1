import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { deCentavos, subtotalEnCentavos } from '../commons/dinero.js';
import { Rol } from '../commons/enums/rol.enum.js';
import { TipoVenta } from '../commons/enums/tipo-venta.enum.js';
import type {
  ActualizarVentaDto,
  CrearVentaDto,
  DetalleDeVentaDto,
  FiltroVentasDto,
} from '../dto/venta.dto.js';
import { DetalleVenta } from '../entities/detalle-venta.entity.js';
import { ProductoSucursal } from '../entities/producto-sucursal.entity.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { Venta } from '../entities/venta.entity.js';
import { VentasRepository } from '../repositories/ventas.repository.js';
import { BitacoraService } from './bitacora.service.js';
import { PagosService } from './pagos.service.js';

const NO_ENCONTRADA = 'Venta no encontrada';

@Injectable()
export class VentasService {
  constructor(
    private readonly repo: VentasRepository,
    private readonly pagos: PagosService,
    private readonly bitacora: BitacoraService,
  ) {}

  listar(filtro: FiltroVentasDto, actor: Usuario): Promise<Venta[]> {
    const usuarioId = this.esCliente(actor) ? actor.id : filtro.usuario_id;
    return this.repo.listar(usuarioId, filtro.tipo_venta);
  }

  async obtener(id: number, actor: Usuario): Promise<Venta> {
    const venta = await this.repo.obtenerCompleta(id);
    if (!venta) throw new NotFoundException(NO_ENCONTRADA);

    if (this.esCliente(actor) && venta.usuario_id !== actor.id) {
      throw new ForbiddenException('Esa venta no es tuya');
    }

    return venta;
  }

  async crear(datos: CrearVentaDto, actor: Usuario): Promise<Venta> {
    const esCliente = this.esCliente(actor);
    const usuarioId = esCliente ? actor.id : datos.usuario_id;

    if (!(await this.repo.existeUsuario(usuarioId))) {
      throw new BadRequestException('El usuario no existe');
    }

    this.verificarReglasDePago(datos, esCliente);

    let totalVerificado: string | null = null;
    if (datos.pago_id) {
      if (await this.repo.pagoYaUsado(datos.pago_id)) {
        throw new ConflictException('Ese pago ya esta asociado a otra venta');
      }
      totalVerificado = await this.totalDe(datos.detalles);
      await this.pagos.verificar(datos.pago_id, totalVerificado);
    }

    const venta = await this.repo.transaccion(async (manager) => {
      const pedido = this.agruparPorStock(datos.detalles);
      const stocks = await this.bloquearYValidar(manager, pedido);

      let totalCentavos = 0;
      for (const [stockId, cantidad] of pedido) {
        totalCentavos += subtotalEnCentavos(
          stocks.get(stockId)!.precio,
          cantidad,
        );
      }
      const total = deCentavos(totalCentavos);

      if (totalVerificado !== null && total !== totalVerificado) {
        throw new ConflictException(
          'Los precios cambiaron mientras se procesaba el pago. No se registro la venta.',
        );
      }

      const venta = await manager.getRepository(Venta).save(
        manager.getRepository(Venta).create({
          tipo_venta: datos.tipo_venta,
          usuario_id: usuarioId,
          total,
          pago_id: datos.pago_id ?? null,
        }),
      );

      for (const [stockId, cantidad] of pedido) {
        const stock = stocks.get(stockId)!;

        await manager.getRepository(DetalleVenta).save(
          manager.getRepository(DetalleVenta).create({
            venta_id: venta.id,
            producto_sucursal_id: stock.id,
            cantidad,
            precio: stock.precio,
          }),
        );

        stock.cantidad -= cantidad;
        await manager.getRepository(ProductoSucursal).save(stock);

        await this.bitacora.registrar(
          manager,
          actor,
          `Venta #${venta.id}: salida de ${cantidad} unidad(es)`,
          stock.producto?.nombre ?? null,
        );
      }

      return venta;
    });

    if (datos.pago_id) {
      await this.pagos.marcarVenta(datos.pago_id, venta.id);
    }

    return (await this.repo.obtenerCompleta(venta.id)) ?? venta;
  }

  async actualizar(id: number, datos: ActualizarVentaDto): Promise<Venta> {
    const venta = await this.repo.obtener(id);
    if (!venta) throw new NotFoundException(NO_ENCONTRADA);

    Object.assign(venta, datos);
    return this.repo.guardar(venta);
  }

  async anular(id: number, actor: Usuario): Promise<{ mensaje: string }> {
    await this.repo.transaccion(async (manager) => {
      const venta = await manager.getRepository(Venta).findOne({
        where: { id },
        relations: { detalles: true },
      });
      if (!venta) throw new NotFoundException(NO_ENCONTRADA);

      const detalles = venta.detalles ?? [];
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

        stock.cantidad += detalle.cantidad;
        await manager.getRepository(ProductoSucursal).save(stock);

        await this.bitacora.registrar(
          manager,
          actor,
          `Anulacion venta #${venta.id}: reingreso de ${detalle.cantidad} unidad(es)`,
          stock.producto?.nombre ?? null,
        );
      }

      await manager.getRepository(Venta).delete({ id });
    });

    return { mensaje: 'Venta anulada, el stock fue devuelto' };
  }

  async totalDe(detalles: DetalleDeVentaDto[]): Promise<string> {
    const pedido = this.agruparPorStock(detalles);
    const stocks = await this.repo.stockPorIds([...pedido.keys()]);
    const porId = new Map(stocks.map((stock) => [stock.id, stock]));

    let totalCentavos = 0;
    for (const [stockId, cantidad] of pedido) {
      const stock = porId.get(stockId);
      if (!stock)
        throw new BadRequestException(`No existe el stock ${stockId}`);

      const disponible = stock.cantidad - stock.cantidad_reservada;
      if (disponible < cantidad) {
        throw new ConflictException(
          `Stock insuficiente para el producto ${stock.producto_id}: ` +
            `quedan ${disponible}, se piden ${cantidad}`,
        );
      }

      totalCentavos += subtotalEnCentavos(stock.precio, cantidad);
    }

    return deCentavos(totalCentavos);
  }

  private verificarReglasDePago(
    datos: CrearVentaDto,
    esCliente: boolean,
  ): void {
    if (esCliente && datos.tipo_venta === TipoVenta.PRESENCIAL) {
      throw new ForbiddenException(
        'Un cliente no puede registrar ventas presenciales: las cobra la caja de la sucursal',
      );
    }

    if (datos.pago_id) {
      this.pagos.exigirPasarela();
      return;
    }

    if (esCliente && this.pagos.habilitado) {
      throw new HttpException(
        'Falta el pago: la compra virtual debe pagarse con la pasarela',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  private agruparPorStock(detalles: DetalleDeVentaDto[]): Map<number, number> {
    const pedido = new Map<number, number>();
    for (const linea of detalles) {
      pedido.set(
        linea.producto_sucursal_id,
        (pedido.get(linea.producto_sucursal_id) ?? 0) + linea.cantidad,
      );
    }
    return pedido;
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
            `quedan ${disponible}, se piden ${cantidad}`,
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

  private esCliente(usuario: Usuario): boolean {
    return usuario.rol?.nombre === Rol.CLIENTE;
  }
}
