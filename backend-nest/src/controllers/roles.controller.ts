import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../commons/decorators/roles.decorator.js';
import { Rol } from '../commons/enums/rol.enum.js';
import { PipeId } from '../commons/pipes.js';
import { ActualizarRolDto, CrearRolDto } from '../dto/catalogos.dto.js';
import { RolesService } from '../services/roles.service.js';

@ApiTags('Roles')
@ApiBearerAuth()
@Roles(Rol.ADMINISTRADOR)
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar roles' })
  listar() {
    return this.roles.listar();
  }

  @Get(':rol_id')
  @ApiOperation({ summary: 'Obtener un rol' })
  obtener(@Param('rol_id', PipeId) id: number) {
    return this.roles.obtener(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un rol' })
  crear(@Body() datos: CrearRolDto) {
    return this.roles.crear(datos);
  }

  @Put(':rol_id')
  @ApiOperation({ summary: 'Actualizar un rol' })
  actualizar(
    @Param('rol_id', PipeId) id: number,
    @Body() datos: ActualizarRolDto,
  ) {
    return this.roles.actualizar(id, datos);
  }

  @Delete(':rol_id')
  @ApiOperation({ summary: 'Eliminar un rol' })
  eliminar(@Param('rol_id', PipeId) id: number) {
    return this.roles.eliminar(id);
  }
}
