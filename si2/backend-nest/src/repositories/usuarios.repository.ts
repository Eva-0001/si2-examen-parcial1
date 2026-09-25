import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Reserva } from '../entities/reserva.entity.js';
import { Rol } from '../entities/rol.entity.js';
import { Usuario } from '../entities/usuario.entity.js';
import { Venta } from '../entities/venta.entity.js';

@Injectable()
export class UsuariosRepository {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Rol) private readonly roles: Repository<Rol>,
    @InjectRepository(Venta) private readonly ventas: Repository<Venta>,
    @InjectRepository(Reserva) private readonly reservas: Repository<Reserva>,
  ) {}

  listar(rolId?: number, buscar?: string): Promise<Usuario[]> {
    const consulta = this.usuarios.createQueryBuilder('usuario');

    if (rolId !== undefined) {
      consulta.andWhere('usuario.rol_id = :rolId', { rolId });
    }

    if (buscar) {
      consulta.andWhere(
        '(usuario.nombre ILIKE :patron OR usuario.apellido ILIKE :patron OR usuario.username ILIKE :patron)',
        { patron: `%${buscar}%` },
      );
    }

    return consulta.orderBy('usuario.apellido', 'ASC').getMany();
  }

  obtener(id: number): Promise<Usuario | null> {
    return this.usuarios.findOne({ where: { id } });
  }

  obtenerConRol(id: number): Promise<Usuario | null> {
    return this.usuarios.findOne({ where: { id }, relations: { rol: true } });
  }

  porUsername(username: string): Promise<Usuario | null> {
    return this.usuarios.findOne({
      where: { username },
      relations: { rol: true },
    });
  }

  existeRol(rolId: number): Promise<boolean> {
    return this.roles.existsBy({ id: rolId });
  }

  rolPorNombre(nombre: string): Promise<Rol | null> {
    return this.roles.findOne({ where: { nombre } });
  }

  usernameOcupado(username: string, excluirId?: number): Promise<boolean> {
    return this.usuarios.existsBy(
      excluirId === undefined ? { username } : { username, id: Not(excluirId) },
    );
  }

  correoOcupado(correo: string, excluirId?: number): Promise<boolean> {
    return this.usuarios.existsBy(
      excluirId === undefined ? { correo } : { correo, id: Not(excluirId) },
    );
  }

  async tieneMovimientos(id: number): Promise<boolean> {
    const [conVentas, conReservas] = await Promise.all([
      this.ventas.existsBy({ usuario_id: id }),
      this.reservas.existsBy({ usuario_id: id }),
    ]);
    return conVentas || conReservas;
  }

  crear(datos: Partial<Usuario>): Usuario {
    return this.usuarios.create(datos);
  }

  guardar(usuario: Usuario): Promise<Usuario> {
    return this.usuarios.save(usuario);
  }

  async eliminar(id: number): Promise<void> {
    await this.usuarios.delete(id);
  }
}
