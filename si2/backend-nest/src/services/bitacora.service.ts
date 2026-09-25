import { Injectable, NotFoundException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { FiltroBitacoraDto } from '../dto/bitacora.dto.js';
import type { Bitacora } from '../entities/bitacora.entity.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { BitacoraRepository } from '../repositories/bitacora.repository.js';

@Injectable()
export class BitacoraService {
  constructor(private readonly repo: BitacoraRepository) {}

  listar(filtro: FiltroBitacoraDto): Promise<Bitacora[]> {
    return this.repo.listar(filtro.encargado, filtro.desde, filtro.hasta);
  }

  async obtener(id: number): Promise<Bitacora> {
    const registro = await this.repo.obtener(id);
    if (!registro) throw new NotFoundException('Registro no encontrado');
    return registro;
  }

  registrar(
    manager: EntityManager,
    actor: Usuario,
    accion: string,
    producto?: string | null,
  ): Promise<void> {
    return this.repo.registrar(manager, {
      accion,
      encargado: actor.username,
      actor_id: actor.id,
      producto: producto ?? null,
    });
  }
}
