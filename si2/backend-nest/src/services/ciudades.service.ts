import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ActualizarCiudadDto,
  CrearCiudadDto,
} from '../dto/catalogos.dto.js';
import type { Ciudad } from '../entities/ciudad.entity.js';
import { CiudadesRepository } from '../repositories/ubicacion.repository.js';

const NO_ENCONTRADA = 'Ciudad no encontrada';

@Injectable()
export class CiudadesService {
  constructor(private readonly repo: CiudadesRepository) {}

  listar(): Promise<Ciudad[]> {
    return this.repo.listar();
  }

  async obtener(id: number): Promise<Ciudad> {
    const ciudad = await this.repo.obtener(id);
    if (!ciudad) throw new NotFoundException(NO_ENCONTRADA);
    return ciudad;
  }

  async crear(datos: CrearCiudadDto): Promise<Ciudad> {
    if (await this.repo.nombreOcupado(datos.nombre)) {
      throw new ConflictException('Ya existe una ciudad con ese nombre');
    }
    return this.repo.crear(datos);
  }

  async actualizar(id: number, datos: ActualizarCiudadDto): Promise<Ciudad> {
    const ciudad = await this.obtener(id);

    if (
      datos.nombre !== undefined &&
      (await this.repo.nombreOcupado(datos.nombre, id))
    ) {
      throw new ConflictException('Ya existe una ciudad con ese nombre');
    }

    Object.assign(ciudad, datos);
    return this.repo.guardar(ciudad);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    await this.obtener(id);

    if (await this.repo.tieneSucursales(id)) {
      throw new ConflictException(
        'No se puede eliminar la ciudad porque tiene sucursales asociadas',
      );
    }

    await this.repo.eliminar(id);
    return { mensaje: 'Ciudad eliminada' };
  }
}
