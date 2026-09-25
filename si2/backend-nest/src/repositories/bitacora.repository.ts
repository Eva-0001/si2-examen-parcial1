import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { Repository } from 'typeorm';
import { Bitacora } from '../entities/bitacora.entity.js';

export interface MovimientoDeBitacora {
  accion: string;
  encargado: string;
  actor_id: number | null;
  producto?: string | null;
}

@Injectable()
export class BitacoraRepository {
  constructor(
    @InjectRepository(Bitacora) private readonly bitacora: Repository<Bitacora>,
  ) {}

  listar(
    encargado?: string,
    desde?: string,
    hasta?: string,
  ): Promise<Bitacora[]> {
    const consulta = this.bitacora.createQueryBuilder('registro');

    if (encargado) {
      consulta.andWhere('registro.encargado ILIKE :encargado', {
        encargado: `%${encargado}%`,
      });
    }
    if (desde) {
      consulta.andWhere('registro.fecha >= CAST(:desde AS date)', { desde });
    }
    if (hasta) {
      consulta.andWhere(
        "registro.fecha < CAST(:hasta AS date) + INTERVAL '1 day'",
        {
          hasta,
        },
      );
    }

    return consulta
      .orderBy('registro.fecha', 'DESC')
      .addOrderBy('registro.id', 'DESC')
      .getMany();
  }

  obtener(id: number): Promise<Bitacora | null> {
    return this.bitacora.findOne({ where: { id } });
  }

  async registrar(
    manager: EntityManager,
    datos: MovimientoDeBitacora,
  ): Promise<void> {
    const repo = manager.getRepository(Bitacora);
    await repo.save(
      repo.create({
        accion: datos.accion,
        encargado: datos.encargado,
        actor_id: datos.actor_id,
        producto: datos.producto ?? null,
      }),
    );
  }
}
