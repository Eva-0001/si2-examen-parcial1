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
  ActualizarCategoriaDto,
  CrearCategoriaDto,
} from '../dto/catalogos.dto.js';
import { CategoriasService } from '../services/catalogos.service.js';

@ApiTags('Categorias')
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categorias: CategoriasService) {}

  @Publico()
  @Get()
  @ApiOperation({ summary: 'Listar categorias (publico)' })
  listar() {
    return this.categorias.listar();
  }

  @Publico()
  @Get(':categoria_id')
  @ApiOperation({ summary: 'Obtener una categoria (publico)' })
  obtener(@Param('categoria_id', PipeId) id: number) {
    return this.categorias.obtener(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear una categoria' })
  crear(@Body() datos: CrearCategoriaDto) {
    return this.categorias.crear(datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Put(':categoria_id')
  @ApiOperation({ summary: 'Actualizar una categoria' })
  actualizar(
    @Param('categoria_id', PipeId) id: number,
    @Body() datos: ActualizarCategoriaDto,
  ) {
    return this.categorias.actualizar(id, datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Delete(':categoria_id')
  @ApiOperation({ summary: 'Eliminar una categoria' })
  eliminar(@Param('categoria_id', PipeId) id: number) {
    return this.categorias.eliminar(id);
  }
}
