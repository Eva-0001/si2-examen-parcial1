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
import { ActualizarTallaDto, CrearTallaDto } from '../dto/catalogos.dto.js';
import { TallasService } from '../services/catalogos.service.js';

@ApiTags('Tallas')
@Controller('tallas')
export class TallasController {
  constructor(private readonly tallas: TallasService) {}

  @Publico()
  @Get()
  @ApiOperation({ summary: 'Listar tallas (publico)' })
  listar() {
    return this.tallas.listar();
  }

  @Publico()
  @Get(':talla_id')
  @ApiOperation({ summary: 'Obtener una talla (publico)' })
  obtener(@Param('talla_id', PipeId) id: number) {
    return this.tallas.obtener(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear una talla' })
  crear(@Body() datos: CrearTallaDto) {
    return this.tallas.crear(datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Put(':talla_id')
  @ApiOperation({ summary: 'Actualizar una talla' })
  actualizar(
    @Param('talla_id', PipeId) id: number,
    @Body() datos: ActualizarTallaDto,
  ) {
    return this.tallas.actualizar(id, datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Delete(':talla_id')
  @ApiOperation({ summary: 'Eliminar una talla' })
  eliminar(@Param('talla_id', PipeId) id: number) {
    return this.tallas.eliminar(id);
  }
}
