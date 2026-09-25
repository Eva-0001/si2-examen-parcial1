import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { Usuario } from '../../entities/usuario.entity.js';
import { PUBLICO } from '../decorators/publico.decorator.js';

export interface ContenidoDelToken {
  sub: string;
  username: string;
  rol_id: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean>(PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (esPublico) return true;

    const peticion = contexto
      .switchToHttp()
      .getRequest<Request & { usuario?: Usuario }>();
    const [tipo, token] = peticion.headers.authorization?.split(' ') ?? [];
    if (tipo?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Token requerido');
    }

    let contenido: ContenidoDelToken;
    try {
      contenido = await this.jwt.verifyAsync<ContenidoDelToken>(token);
    } catch {
      throw new UnauthorizedException('Token invalido o vencido');
    }

    const usuario = await this.usuarios.findOne({
      where: { id: Number(contenido.sub) },
      relations: { rol: true },
    });
    if (!usuario) throw new UnauthorizedException('Token invalido o vencido');

    peticion.usuario = usuario;
    return true;
  }
}
