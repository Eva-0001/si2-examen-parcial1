import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hashearPassword } from '../commons/passwords.js';
import type {
  ActualizarTrabajadorDto,
  CrearTrabajadorDto,
  FiltroTrabajadoresDto,
} from '../dto/trabajador.dto.js';
import type { Trabajador } from '../entities/trabajador.entity.js';
import { TrabajadoresRepository } from '../repositories/trabajadores.repository.js';
import { UsuariosRepository } from '../repositories/usuarios.repository.js';

const NO_ENCONTRADO = 'Trabajador no encontrado';

const CAMPOS_DE_CONTRATO = [
  'codigo',
  'fecha_contrato',
  'sueldo',
  'sucursal_id',
] as const;

@Injectable()
export class TrabajadoresService {
  constructor(
    private readonly repo: TrabajadoresRepository,
    private readonly usuarios: UsuariosRepository,
  ) {}

  async listar(filtro: FiltroTrabajadoresDto): Promise<unknown[]> {
    const trabajadores = await this.repo.listar(filtro.sucursal_id);
    return trabajadores.map((trabajador) => this.aSalida(trabajador));
  }

  async obtenerDetalle(id: number): Promise<unknown> {
    const trabajador = await this.repo.obtenerCompleto(id);
    if (!trabajador) throw new NotFoundException(NO_ENCONTRADO);

    return {
      ...this.aSalida(trabajador),
      rol: trabajador.usuario?.rol ?? null,
      sucursal: trabajador.sucursal ?? null,
    };
  }

  async crear(datos: CrearTrabajadorDto): Promise<unknown> {
    await this.verificarRelaciones(
      datos.rol_id,
      datos.sucursal_id ?? undefined,
    );
    await this.verificarIdentidadLibre(
      datos.username,
      datos.correo,
      datos.codigo,
    );

    const id = await this.repo.crear({
      usuario: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        correo: datos.correo,
        username: datos.username,
        genero: datos.genero ?? null,
        rol_id: datos.rol_id,
        password: await hashearPassword(datos.password),
      },
      trabajador: {
        codigo: datos.codigo,
        fecha_contrato: datos.fecha_contrato,
        sueldo: datos.sueldo,
        sucursal_id: datos.sucursal_id ?? null,
      },
    });

    return this.obtenerSalida(id);
  }

  async actualizar(
    id: number,
    datos: ActualizarTrabajadorDto,
  ): Promise<unknown> {
    await this.obtener(id);
    await this.verificarRelaciones(
      datos.rol_id,
      datos.sucursal_id ?? undefined,
    );
    await this.verificarIdentidadLibre(
      datos.username,
      datos.correo,
      datos.codigo,
      id,
    );

    const { usuario, trabajador } = this.separarCampos(datos);
    await this.repo.actualizar(id, { usuario, trabajador });

    return this.obtenerSalida(id);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    await this.obtener(id);

    if (await this.usuarios.tieneMovimientos(id)) {
      throw new ConflictException(
        'No se puede eliminar el trabajador porque tiene ventas o reservas',
      );
    }

    await this.repo.eliminar(id);
    return { mensaje: 'Trabajador eliminado' };
  }

  private async obtener(id: number): Promise<Trabajador> {
    const trabajador = await this.repo.obtener(id);
    if (!trabajador) throw new NotFoundException(NO_ENCONTRADO);
    return trabajador;
  }

  private async obtenerSalida(id: number): Promise<unknown> {
    return this.aSalida(await this.obtener(id));
  }

  private aSalida(trabajador: Trabajador): Record<string, unknown> {
    const usuario = trabajador.usuario;

    return {
      nombre: usuario?.nombre,
      apellido: usuario?.apellido,
      correo: usuario?.correo,
      username: usuario?.username,
      genero: usuario?.genero ?? null,
      rol_id: usuario?.rol_id,
      codigo: trabajador.codigo,
      fecha_contrato: trabajador.fecha_contrato,
      sueldo: trabajador.sueldo,
      sucursal_id: trabajador.sucursal_id,
      id: trabajador.id,
    };
  }

  private separarCampos(datos: ActualizarTrabajadorDto) {
    const usuario: Record<string, unknown> = {};
    const trabajador: Record<string, unknown> = {};

    for (const [campo, valor] of Object.entries(datos)) {
      if (valor === undefined) continue;
      if ((CAMPOS_DE_CONTRATO as readonly string[]).includes(campo)) {
        trabajador[campo] = valor;
      } else {
        usuario[campo] = valor;
      }
    }

    return { usuario, trabajador };
  }

  private async verificarRelaciones(
    rolId: number | undefined,
    sucursalId: number | undefined,
  ): Promise<void> {
    if (rolId !== undefined && !(await this.usuarios.existeRol(rolId))) {
      throw new BadRequestException('El rol no existe');
    }
    if (
      sucursalId !== undefined &&
      !(await this.repo.existeSucursal(sucursalId))
    ) {
      throw new BadRequestException('La sucursal no existe');
    }
  }

  private async verificarIdentidadLibre(
    username: string | undefined,
    correo: string | undefined,
    codigo: string | undefined,
    excluirId?: number,
  ): Promise<void> {
    if (
      username !== undefined &&
      (await this.usuarios.usernameOcupado(username, excluirId))
    ) {
      throw new ConflictException('El username ya esta en uso');
    }
    if (
      correo !== undefined &&
      (await this.usuarios.correoOcupado(correo, excluirId))
    ) {
      throw new ConflictException('El correo ya esta registrado');
    }
    if (
      codigo !== undefined &&
      (await this.repo.codigoOcupado(codigo, excluirId))
    ) {
      throw new ConflictException('Ya existe un trabajador con ese codigo');
    }
  }
}
