import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../commons/decorators/roles.decorator.js';
import { UsuarioActual } from '../commons/decorators/usuario-actual.decorator.js';
import { Rol } from '../commons/enums/rol.enum.js';
import { PipeId } from '../commons/pipes.js';
import {
  ActualizarUsuarioDto,
  CambiarPasswordDto,
  CrearUsuarioDto,
  FiltroUsuariosDto,
  ResetearPasswordDto,
} from '../dto/usuario.dto.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { UsuariosService } from '../services/usuarios.service.js';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Roles(Rol.ADMINISTRADOR)
  @Get()
  @ApiOperation({ summary: 'Listar usuarios' })
  listar(@Query() filtro: FiltroUsuariosDto) {
    return this.usuarios.listar(filtro);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Get(':usuario_id')
  @ApiOperation({ summary: 'Obtener un usuario con su rol' })
  obtener(@Param('usuario_id', PipeId) id: number) {
    return this.usuarios.obtenerConRol(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Post()
  @ApiOperation({ summary: 'Crear un usuario' })
  crear(@Body() datos: CrearUsuarioDto) {
    return this.usuarios.crear(datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Put(':usuario_id')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  actualizar(
    @Param('usuario_id', PipeId) id: number,
    @Body() datos: ActualizarUsuarioDto,
  ) {
    return this.usuarios.actualizar(id, datos);
  }

  @Patch(':usuario_id/password')
  @ApiOperation({ summary: 'Cambiar la propia password' })
  cambiarPassword(
    @Param('usuario_id', PipeId) id: number,
    @Body() datos: CambiarPasswordDto,
    @UsuarioActual() actor: Usuario,
  ) {
    return this.usuarios.cambiarPassword(actor, id, datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Patch(':usuario_id/password/reset')
  @ApiOperation({
    summary: 'Restablecer la password de un usuario (no pide la anterior)',
  })
  resetearPassword(
    @Param('usuario_id', PipeId) id: number,
    @Body() datos: ResetearPasswordDto,
  ) {
    return this.usuarios.resetearPassword(id, datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Delete(':usuario_id')
  @ApiOperation({ summary: 'Eliminar un usuario' })
  eliminar(@Param('usuario_id', PipeId) id: number) {
    return this.usuarios.eliminar(id);
  }
}
