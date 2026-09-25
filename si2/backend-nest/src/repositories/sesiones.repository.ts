import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Sesion } from '../entities/sesion.entity.js';

@Injectable()
export class SesionesRepository {
  constructor(
    @InjectRepository(Sesion) private readonly sesiones: Repository<Sesion>,
  ) {}

  crear(datos: Pick<Sesion, 'id' | 'usuario_id' | 'token_hash' | 'expira_en'>) {
    return this.sesiones.save(this.sesiones.create(datos));
  }

  obtener(id: string): Promise<Sesion | null> {
    return this.sesiones.findOne({ where: { id } });
  }

  async borrar(id: string): Promise<boolean> {
    const resultado = await this.sesiones.delete({ id });
    return (resultado.affected ?? 0) > 0;
  }

  async borrarVencidas(usuarioId: number): Promise<void> {
    await this.sesiones.delete({
      usuario_id: usuarioId,
      expira_en: LessThan(new Date()),
    });
  }
}
