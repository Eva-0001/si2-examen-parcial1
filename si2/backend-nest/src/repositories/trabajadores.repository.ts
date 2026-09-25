import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { Sucursal } from '../entities/sucursal.entity.js';
import { Trabajador } from '../entities/trabajador.entity.js';
import { Usuario } from '../entities/usuario.entity.js';

export interface DatosDeTrabajador {
  usuario: Partial<Usuario>;
  trabajador: Partial<Trabajador>;
}

@Injectable()
export class TrabajadoresRepository {
  constructor(
    @InjectRepository(Trabajador)
    private readonly trabajadores: Repository<Trabajador>,
    @InjectRepository(Sucursal)
    private readonly sucursales: Repository<Sucursal>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  listar(sucursalId?: number): Promise<Trabajador[]> {
    return this.trabajadores.find({
      where: sucursalId === undefined ? {} : { sucursal_id: sucursalId },
      relations: { usuario: true },
      order: { codigo: 'ASC' },
    });
  }

  obtener(id: number): Promise<Trabajador | null> {
    return this.trabajadores.findOne({
      where: { id },
      relations: { usuario: true },
    });
  }

  obtenerCompleto(id: number): Promise<Trabajador | null> {
    return this.trabajadores.findOne({
      where: { id },
      relations: { usuario: { rol: true }, sucursal: true },
    });
  }

  existeSucursal(sucursalId: number): Promise<boolean> {
    return this.sucursales.existsBy({ id: sucursalId });
  }

  codigoOcupado(codigo: string, excluirId?: number): Promise<boolean> {
    return this.trabajadores.existsBy(
      excluirId === undefined ? { codigo } : { codigo, id: Not(excluirId) },
    );
  }

  async crear(datos: DatosDeTrabajador): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const usuario = await manager
        .getRepository(Usuario)
        .save(
          manager
            .getRepository(Usuario)
            .create({ ...datos.usuario, tipo: 'trabajador' }),
        );

      await manager
        .getRepository(Trabajador)
        .save(
          manager
            .getRepository(Trabajador)
            .create({ ...datos.trabajador, id: usuario.id }),
        );

      return usuario.id;
    });
  }

  async actualizar(id: number, datos: DatosDeTrabajador): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      if (Object.keys(datos.usuario).length > 0) {
        await manager.getRepository(Usuario).update({ id }, datos.usuario);
      }
      if (Object.keys(datos.trabajador).length > 0) {
        await manager
          .getRepository(Trabajador)
          .update({ id }, datos.trabajador);
      }
    });
  }

  async eliminar(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Trabajador).delete({ id });
      await manager.getRepository(Usuario).delete({ id });
    });
  }
}
