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
  ActualizarTemporadaDto,
  CrearTemporadaDto,
} from '../dto/catalogos.dto.js';
import { TemporadasService } from '../services/catalogos.service.js';

@ApiTags('Temporadas')
@Controller('temporadas')
export class TemporadasController {
  constructor(private readonly temporadas: TemporadasService) {}

  @Publico()
  @Get()
  @ApiOperation({ summary: 'Listar temporadas (publico)' })
  listar() {
    return this.temporadas.listar();
  }

  @Publico()
  @Get(':temporada_id')
  @ApiOperation({ summary: 'Obtener una temporada (publico)' })
  obtener(@Param('temporada_id', PipeId) id: number) {
    return this.temporadas.obtener(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear una temporada' })
  crear(@Body() datos: CrearTemporadaDto) {
    return this.temporadas.crear(datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Put(':temporada_id')
  @ApiOperation({ summary: 'Actualizar una temporada' })
  actualizar(
    @Param('temporada_id', PipeId) id: number,
    @Body() datos: ActualizarTemporadaDto,
  ) {
    return this.temporadas.actualizar(id, datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Delete(':temporada_id')
  @ApiOperation({ summary: 'Eliminar una temporada' })
  eliminar(@Param('temporada_id', PipeId) id: number) {
    return this.temporadas.eliminar(id);
  }
}
