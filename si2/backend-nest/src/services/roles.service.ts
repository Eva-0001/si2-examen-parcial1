import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ActualizarRolDto, CrearRolDto } from '../dto/catalogos.dto.js';
import type { Rol } from '../entities/rol.entity.js';
import { RolesRepository } from '../repositories/roles.repository.js';

const NO_ENCONTRADO = 'Rol no encontrado';

@Injectable()
export class RolesService {
  constructor(private readonly repo: RolesRepository) {}

  listar(): Promise<Rol[]> {
    return this.repo.listar();
  }

  async obtener(id: number): Promise<Rol> {
    const rol = await this.repo.obtener(id);
    if (!rol) throw new NotFoundException(NO_ENCONTRADO);
    return rol;
  }

  async crear(datos: CrearRolDto): Promise<Rol> {
    if (await this.repo.nombreOcupado(datos.nombre)) {
      throw new ConflictException('Ya existe un rol con ese nombre');
    }
    return this.repo.crear(datos);
  }

  async actualizar(id: number, datos: ActualizarRolDto): Promise<Rol> {
    const rol = await this.obtener(id);

    if (
      datos.nombre !== undefined &&
      (await this.repo.nombreOcupado(datos.nombre, id))
    ) {
      throw new ConflictException('Ya existe un rol con ese nombre');
    }

    Object.assign(rol, datos);
    return this.repo.guardar(rol);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    await this.obtener(id);

    if (await this.repo.tieneUsuarios(id)) {
      throw new ConflictException(
        'No se puede eliminar el rol porque tiene usuarios asignados',
      );
    }

    await this.repo.eliminar(id);
    return { mensaje: 'Rol eliminado' };
  }
}
