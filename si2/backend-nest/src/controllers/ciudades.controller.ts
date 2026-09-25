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
import { Publico } from '../commons/decorators/publico.decorator.js';
import { Roles } from '../commons/decorators/roles.decorator.js';
import { Rol } from '../commons/enums/rol.enum.js';
import { PipeId } from '../commons/pipes.js';
import { ActualizarCiudadDto, CrearCiudadDto } from '../dto/catalogos.dto.js';
import { CiudadesService } from '../services/ciudades.service.js';

@ApiTags('Ciudades')
@Controller('ciudades')
export class CiudadesController {
  constructor(private readonly ciudades: CiudadesService) {}

  @Publico()
  @Get()
  @ApiOperation({ summary: 'Listar ciudades (publico)' })
  listar() {
    return this.ciudades.listar();
  }

  @Publico()
  @Get(':ciudad_id')
  @ApiOperation({ summary: 'Obtener una ciudad (publico)' })
  obtener(@Param('ciudad_id', PipeId) id: number) {
    return this.ciudades.obtener(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear una ciudad' })
  crear(@Body() datos: CrearCiudadDto) {
    return this.ciudades.crear(datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Put(':ciudad_id')
  @ApiOperation({ summary: 'Actualizar una ciudad' })
  actualizar(
    @Param('ciudad_id', PipeId) id: number,
    @Body() datos: ActualizarCiudadDto,
  ) {
    return this.ciudades.actualizar(id, datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Delete(':ciudad_id')
  @ApiOperation({ summary: 'Eliminar una ciudad (falla si tiene sucursales)' })
  eliminar(@Param('ciudad_id', PipeId) id: number) {
    return this.ciudades.eliminar(id);
  }
}
