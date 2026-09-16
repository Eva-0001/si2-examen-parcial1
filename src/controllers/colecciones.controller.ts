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
import {
  ActualizarColeccionDto,
  CrearColeccionDto,
} from '../dto/catalogos.dto.js';
import { ColeccionesService } from '../services/catalogos.service.js';

@ApiTags('Colecciones')
@Controller('colecciones')
export class ColeccionesController {
  constructor(private readonly colecciones: ColeccionesService) {}

  @Publico()
  @Get()
  @ApiOperation({ summary: 'Listar colecciones (publico)' })
  listar() {
    return this.colecciones.listar();
  }

  @Publico()
  @Get(':coleccion_id')
  @ApiOperation({ summary: 'Obtener una coleccion (publico)' })
  obtener(@Param('coleccion_id', PipeId) id: number) {
    return this.colecciones.obtener(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear una coleccion' })
  crear(@Body() datos: CrearColeccionDto) {
    return this.colecciones.crear(datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Put(':coleccion_id')
  @ApiOperation({ summary: 'Actualizar una coleccion' })
  actualizar(
    @Param('coleccion_id', PipeId) id: number,
    @Body() datos: ActualizarColeccionDto,
  ) {
    return this.colecciones.actualizar(id, datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Delete(':coleccion_id')
  @ApiOperation({ summary: 'Eliminar una coleccion' })
  eliminar(@Param('coleccion_id', PipeId) id: number) {
    return this.colecciones.eliminar(id);
  }
}
