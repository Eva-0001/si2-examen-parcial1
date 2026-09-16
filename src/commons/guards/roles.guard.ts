import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Usuario } from '../../entities/usuario.entity.js';
import { ROLES } from '../decorators/roles.decorator.js';
import type { Rol } from '../enums/rol.enum.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<readonly Rol[]>(ROLES, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (!permitidos || permitidos.length === 0) return true;

    const peticion = contexto
      .switchToHttp()
      .getRequest<Request & { usuario?: Usuario }>();
    const usuario = peticion.usuario;
    if (!usuario) {
      throw new UnauthorizedException('Credenciales invalidas o token vencido');
    }

    const rol = usuario.rol?.nombre;
    if (!rol || !permitidos.includes(rol as Rol)) {
      throw new ForbiddenException(
        `Requiere uno de estos roles: ${permitidos.join(', ')}`,
      );
    }

    return true;
  }
}
