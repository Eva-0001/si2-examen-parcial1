import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comprobante } from '../entities/comprobante.entity.js';
import { Venta } from '../entities/venta.entity.js';

@Injectable()
export class ComprobantesRepository {
  constructor(
    @InjectRepository(Comprobante)
    private readonly comprobantes: Repository<Comprobante>,
    @InjectRepository(Venta) private readonly ventas: Repository<Venta>,
  ) {}

  listar(ventaId?: number): Promise<Comprobante[]> {
    return this.comprobantes.find({
      where: ventaId === undefined ? {} : { venta_id: ventaId },
      order: { fecha: 'DESC', id: 'DESC' },
    });
  }

  obtener(id: number): Promise<Comprobante | null> {
    return this.comprobantes.findOne({ where: { id } });
  }

  existeVenta(ventaId: number): Promise<boolean> {
    return this.ventas.existsBy({ id: ventaId });
  }

  crear(datos: Partial<Comprobante>): Promise<Comprobante> {
    return this.comprobantes.save(this.comprobantes.create(datos));
  }

  guardar(comprobante: Comprobante): Promise<Comprobante> {
    return this.comprobantes.save(comprobante);
  }

  async eliminar(id: number): Promise<void> {
    await this.comprobantes.delete(id);
  }
}
