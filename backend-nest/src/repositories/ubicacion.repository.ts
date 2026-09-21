import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Ciudad } from '../entities/ciudad.entity.js';
import { DetalleVenta } from '../entities/detalle-venta.entity.js';
import { Promocion } from '../entities/promocion.entity.js';
import { ReservaSucursal } from '../entities/reserva-sucursal.entity.js';
import { Sucursal } from '../entities/sucursal.entity.js';

@Injectable()
export class CiudadesRepository {
  constructor(
    @InjectRepository(Ciudad) private readonly ciudades: Repository<Ciudad>,
    @InjectRepository(Sucursal)
    private readonly sucursales: Repository<Sucursal>,
  ) {}

  listar(): Promise<Ciudad[]> {
    return this.ciudades.find({ order: { nombre: 'ASC' } });
  }

  obtener(id: number): Promise<Ciudad | null> {
    return this.ciudades.findOne({ where: { id } });
  }

  nombreOcupado(nombre: string, excluirId?: number): Promise<boolean> {
    return this.ciudades.existsBy(
      excluirId === undefined ? { nombre } : { nombre, id: Not(excluirId) },
    );
  }

  tieneSucursales(id: number): Promise<boolean> {
    return this.sucursales.existsBy({ ciudad_id: id });
  }

  crear(datos: Partial<Ciudad>): Promise<Ciudad> {
    return this.ciudades.save(this.ciudades.create(datos));
  }

  guardar(ciudad: Ciudad): Promise<Ciudad> {
    return this.ciudades.save(ciudad);
  }

  async eliminar(id: number): Promise<void> {
    await this.ciudades.delete(id);
  }
}

@Injectable()
export class SucursalesRepository {
  constructor(
    @InjectRepository(Sucursal)
    private readonly sucursales: Repository<Sucursal>,
    @InjectRepository(Ciudad) private readonly ciudades: Repository<Ciudad>,
    @InjectRepository(DetalleVenta)
    private readonly detalles: Repository<DetalleVenta>,
    @InjectRepository(ReservaSucursal)
    private readonly reservados: Repository<ReservaSucursal>,
  ) {}

  listar(ciudadId?: number): Promise<Sucursal[]> {
    return this.sucursales.find({
      where: ciudadId === undefined ? {} : { ciudad_id: ciudadId },
      order: { nombre: 'ASC' },
    });
  }

  obtener(id: number): Promise<Sucursal | null> {
    return this.sucursales.findOne({ where: { id } });
  }

  obtenerConCiudad(id: number): Promise<Sucursal | null> {
    return this.sucursales.findOne({
      where: { id },
      relations: { ciudad: true },
    });
  }

  existeCiudad(ciudadId: number): Promise<boolean> {
    return this.ciudades.existsBy({ id: ciudadId });
  }

  async tieneMovimientos(id: number): Promise<boolean> {
    const [conVentas, conReservas] = await Promise.all([
      this.detalles
        .createQueryBuilder('detalle')
        .innerJoin('detalle.producto_sucursal', 'stock')
        .where('stock.sucursal_id = :id', { id })
        .getExists(),
      this.reservados
        .createQueryBuilder('reservado')
        .innerJoin('reservado.producto_sucursal', 'stock')
        .where('stock.sucursal_id = :id', { id })
        .getExists(),
    ]);
    return conVentas || conReservas;
  }

  crear(datos: Partial<Sucursal>): Promise<Sucursal> {
    return this.sucursales.save(this.sucursales.create(datos));
  }

  guardar(sucursal: Sucursal): Promise<Sucursal> {
    return this.sucursales.save(sucursal);
  }

  async eliminar(id: number): Promise<void> {
    await this.sucursales.delete(id);
  }
}

@Injectable()
export class PromocionesRepository {
  constructor(
    @InjectRepository(Promocion)
    private readonly promociones: Repository<Promocion>,
    @InjectRepository(Sucursal)
    private readonly sucursales: Repository<Sucursal>,
  ) {}

  listar(sucursalId?: number, soloVigentes = false): Promise<Promocion[]> {
    const consulta = this.promociones.createQueryBuilder('promocion');

    if (sucursalId !== undefined) {
      consulta.andWhere('promocion.sucursal_id = :sucursalId', { sucursalId });
    }

    if (soloVigentes) {
      consulta.andWhere('promocion.fecha_inicio <= CURRENT_DATE');
      consulta.andWhere('promocion.fecha_final >= CURRENT_DATE');
    }

    return consulta.orderBy('promocion.fecha_inicio', 'DESC').getMany();
  }

  obtener(id: number): Promise<Promocion | null> {
    return this.promociones.findOne({ where: { id } });
  }

  obtenerConSucursal(id: number): Promise<Promocion | null> {
    return this.promociones.findOne({
      where: { id },
      relations: { sucursal: true },
    });
  }

  existeSucursal(sucursalId: number): Promise<boolean> {
    return this.sucursales.existsBy({ id: sucursalId });
  }

  crear(datos: Partial<Promocion>): Promise<Promocion> {
    return this.promociones.save(this.promociones.create(datos));
  }

  guardar(promocion: Promocion): Promise<Promocion> {
    return this.promociones.save(promocion);
  }

  async eliminar(id: number): Promise<void> {
    await this.promociones.delete(id);
  }
}
