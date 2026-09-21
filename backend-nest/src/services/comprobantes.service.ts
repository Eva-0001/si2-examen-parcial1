import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ActualizarComprobanteDto,
  CrearComprobanteDto,
  FiltroComprobantesDto,
} from '../dto/comprobante.dto.js';
import type { Comprobante } from '../entities/comprobante.entity.js';
import { ComprobantesRepository } from '../repositories/comprobantes.repository.js';

const NO_ENCONTRADO = 'Comprobante no encontrado';

@Injectable()
export class ComprobantesService {
  constructor(private readonly repo: ComprobantesRepository) {}

  listar(filtro: FiltroComprobantesDto): Promise<Comprobante[]> {
    return this.repo.listar(filtro.venta_id);
  }

  async obtener(id: number): Promise<Comprobante> {
    const comprobante = await this.repo.obtener(id);
    if (!comprobante) throw new NotFoundException(NO_ENCONTRADO);
    return comprobante;
  }

  async crear(datos: CrearComprobanteDto): Promise<Comprobante> {
    if (!(await this.repo.existeVenta(datos.venta_id))) {
      throw new BadRequestException('La venta no existe');
    }
    return this.repo.crear(datos);
  }

  async actualizar(
    id: number,
    datos: ActualizarComprobanteDto,
  ): Promise<Comprobante> {
    const comprobante = await this.obtener(id);

    Object.assign(comprobante, datos);
    return this.repo.guardar(comprobante);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    await this.obtener(id);

    await this.repo.eliminar(id);
    return { mensaje: 'Comprobante eliminado' };
  }
}
