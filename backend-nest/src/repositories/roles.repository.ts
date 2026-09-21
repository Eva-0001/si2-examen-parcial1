import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Rol } from '../entities/rol.entity.js';
import { Usuario } from '../entities/usuario.entity.js';

@Injectable()
export class RolesRepository {
  constructor(
    @InjectRepository(Rol) private readonly roles: Repository<Rol>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
  ) {}

  listar(): Promise<Rol[]> {
    return this.roles.find({ order: { id: 'ASC' } });
  }

  obtener(id: number): Promise<Rol | null> {
    return this.roles.findOne({ where: { id } });
  }

  nombreOcupado(nombre: string, excluirId?: number): Promise<boolean> {
    return this.roles.existsBy(
      excluirId === undefined ? { nombre } : { nombre, id: Not(excluirId) },
    );
  }

  tieneUsuarios(id: number): Promise<boolean> {
    return this.usuarios.existsBy({ rol_id: id });
  }

  crear(datos: Partial<Rol>): Promise<Rol> {
    return this.roles.save(this.roles.create(datos));
  }

  guardar(rol: Rol): Promise<Rol> {
    return this.roles.save(rol);
  }

  async eliminar(id: number): Promise<void> {
    await this.roles.delete(id);
  }
}
