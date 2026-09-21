import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Publico } from '../commons/decorators/publico.decorator.js';
import { UsuarioActual } from '../commons/decorators/usuario-actual.decorator.js';
import { LoginDto, RegistroDto, TokenDto } from '../dto/auth.dto.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { AuthService } from '../services/auth.service.js';

@ApiTags('Autenticacion')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publico()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesion y obtener el token JWT' })
  @ApiResponse({ status: 200, type: TokenDto })
  login(@Body() datos: LoginDto) {
    return this.auth.login(datos);
  }

  @Publico()
  @Post('registro')
  @ApiOperation({ summary: 'Registro publico de un cliente' })
  @ApiResponse({ status: 201, type: TokenDto })
  registro(@Body() datos: RegistroDto) {
    return this.auth.registro(datos);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Datos del usuario autenticado' })
  yo(@UsuarioActual() usuario: Usuario) {
    return usuario;
  }
}
