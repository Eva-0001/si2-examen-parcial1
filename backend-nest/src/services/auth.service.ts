import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { instanceToPlain } from 'class-transformer';
import { verificarPassword } from '../commons/passwords.js';
import type { LoginDto, RegistroDto } from '../dto/auth.dto.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { UsuariosRepository } from '../repositories/usuarios.repository.js';
import { UsuariosService } from './usuarios.service.js';

export interface RespuestaDeToken {
  access_token: string;
  token_type: string;
  usuario: unknown;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: UsuariosRepository,
    private readonly usuarios: UsuariosService,
    private readonly jwt: JwtService,
  ) {}

  async login(datos: LoginDto): Promise<RespuestaDeToken> {
    const usuario = await this.repo.porUsername(datos.username);

    if (
      !usuario ||
      !(await verificarPassword(datos.password, usuario.password))
    ) {
      throw new UnauthorizedException('Usuario o password incorrectos');
    }

    return this.armarToken(usuario);
  }

  async registro(datos: RegistroDto): Promise<RespuestaDeToken> {
    const usuario = await this.usuarios.registrarCliente(datos);
    const conRol = await this.repo.obtenerConRol(usuario.id);
    return this.armarToken(conRol ?? usuario);
  }

  async armarToken(usuario: Usuario): Promise<RespuestaDeToken> {
    const access_token = await this.jwt.signAsync({
      sub: String(usuario.id),
      username: usuario.username,
      rol_id: usuario.rol_id,
    });

    return {
      access_token,
      token_type: 'bearer',
      usuario: instanceToPlain(usuario),
    };
  }
}
