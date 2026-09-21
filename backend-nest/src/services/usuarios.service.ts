import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Rol } from '../commons/enums/rol.enum.js';
import { hashearPassword, verificarPassword } from '../commons/passwords.js';
import type {
  ActualizarUsuarioDto,
  CambiarPasswordDto,
  CrearUsuarioDto,
  FiltroUsuariosDto,
  ResetearPasswordDto,
} from '../dto/usuario.dto.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { UsuariosRepository } from '../repositories/usuarios.repository.js';

const NO_ENCONTRADO = 'Usuario no encontrado';

@Injectable()
export class UsuariosService {
  constructor(private readonly repo: UsuariosRepository) {}

  listar(filtro: FiltroUsuariosDto): Promise<Usuario[]> {
    return this.repo.listar(filtro.rol_id, filtro.buscar);
  }

  async obtener(id: number): Promise<Usuario> {
    const usuario = await this.repo.obtener(id);
    if (!usuario) throw new NotFoundException(NO_ENCONTRADO);
    return usuario;
  }

  async obtenerConRol(id: number): Promise<Usuario> {
    const usuario = await this.repo.obtenerConRol(id);
    if (!usuario) throw new NotFoundException(NO_ENCONTRADO);
    return usuario;
  }

  async crear(datos: CrearUsuarioDto): Promise<Usuario> {
    if (!(await this.repo.existeRol(datos.rol_id))) {
      throw new BadRequestException('El rol no existe');
    }
    await this.verificarIdentidadLibre(datos.username, datos.correo);

    const { password, ...resto } = datos;
    return this.repo.guardar(
      this.repo.crear({
        ...resto,
        password: await hashearPassword(password),
        tipo: 'usuario',
      }),
    );
  }

  async actualizar(id: number, datos: ActualizarUsuarioDto): Promise<Usuario> {
    const usuario = await this.obtener(id);

    if (
      datos.rol_id !== undefined &&
      !(await this.repo.existeRol(datos.rol_id))
    ) {
      throw new BadRequestException('El rol no existe');
    }
    await this.verificarIdentidadLibre(datos.username, datos.correo, id);

    Object.assign(usuario, datos);
    return this.repo.guardar(usuario);
  }

  async cambiarPassword(
    actor: Usuario,
    usuarioId: number,
    datos: CambiarPasswordDto,
  ): Promise<{ mensaje: string }> {
    if (actor.id !== usuarioId) {
      throw new ForbiddenException('Solo podes cambiar tu propia password');
    }

    const usuario = await this.obtener(usuarioId);
    if (!(await verificarPassword(datos.password_actual, usuario.password))) {
      throw new BadRequestException('La password actual es incorrecta');
    }

    usuario.password = await hashearPassword(datos.password_nuevo);
    await this.repo.guardar(usuario);
    return { mensaje: 'Password actualizada' };
  }

  async resetearPassword(
    usuarioId: number,
    datos: ResetearPasswordDto,
  ): Promise<{ mensaje: string }> {
    const usuario = await this.obtener(usuarioId);

    usuario.password = await hashearPassword(datos.password_nuevo);
    await this.repo.guardar(usuario);
    return { mensaje: 'Password restablecida' };
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    await this.obtener(id);

    if (await this.repo.tieneMovimientos(id)) {
      throw new ConflictException(
        'No se puede eliminar el usuario porque tiene ventas o reservas',
      );
    }

    await this.repo.eliminar(id);
    return { mensaje: 'Usuario eliminado' };
  }

  async registrarCliente(
    datos: Omit<CrearUsuarioDto, 'rol_id'>,
  ): Promise<Usuario> {
    const rolCliente = await this.repo.rolPorNombre(Rol.CLIENTE);
    if (!rolCliente) {
      throw new BadRequestException(
        `Falta crear el rol '${Rol.CLIENTE}' en la base. Corre el seed: npm run seed`,
      );
    }

    return this.crear({ ...datos, rol_id: rolCliente.id });
  }

  private async verificarIdentidadLibre(
    username: string | undefined,
    correo: string | undefined,
    excluirId?: number,
  ): Promise<void> {
    if (
      username !== undefined &&
      (await this.repo.usernameOcupado(username, excluirId))
    ) {
      throw new ConflictException('El username ya esta en uso');
    }
    if (
      correo !== undefined &&
      (await this.repo.correoOcupado(correo, excluirId))
    ) {
      throw new ConflictException('El correo ya esta registrado');
    }
  }
}
