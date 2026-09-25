import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Usuario } from '../../entities/usuario.entity.js';

export const UsuarioActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): Usuario => {
    return contexto.switchToHttp().getRequest().usuario;
  },
);
