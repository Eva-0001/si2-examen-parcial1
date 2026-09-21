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
import { ActualizarColorDto, CrearColorDto } from '../dto/catalogos.dto.js';
import { ColoresService } from '../services/catalogos.service.js';

@ApiTags('Colores')
@Controller('colores')
export class ColoresController {
  constructor(private readonly colores: ColoresService) {}

  @Publico()
  @Get()
  @ApiOperation({ summary: 'Listar colores (publico)' })
  listar() {
    return this.colores.listar();
  }

  @Publico()
  @Get(':color_id')
  @ApiOperation({ summary: 'Obtener un color (publico)' })
  obtener(@Param('color_id', PipeId) id: number) {
    return this.colores.obtener(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear un color' })
  crear(@Body() datos: CrearColorDto) {
    return this.colores.crear(datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Put(':color_id')
  @ApiOperation({ summary: 'Actualizar un color' })
  actualizar(
    @Param('color_id', PipeId) id: number,
    @Body() datos: ActualizarColorDto,
  ) {
    return this.colores.actualizar(id, datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Delete(':color_id')
  @ApiOperation({ summary: 'Eliminar un color' })
  eliminar(@Param('color_id', PipeId) id: number) {
    return this.colores.eliminar(id);
  }
}
