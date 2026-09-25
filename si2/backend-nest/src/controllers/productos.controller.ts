import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UnprocessableEntityException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Publico } from '../commons/decorators/publico.decorator.js';
import { Roles } from '../commons/decorators/roles.decorator.js';
import { CAPACIDAD, Rol } from '../commons/enums/rol.enum.js';
import { PipeId } from '../commons/pipes.js';
import {
  ActualizarProductoDto,
  CrearProductoDto,
  FiltroProductosDto,
} from '../dto/producto.dto.js';
import { ProductosService } from '../services/productos.service.js';

@ApiTags('Productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}

  @Publico()
  @Get()
  @ApiOperation({ summary: 'Listar y filtrar el catalogo (publico)' })
  listar(@Query() filtro: FiltroProductosDto) {
    return this.productos.listar(filtro);
  }

  @Publico()
  @Get(':producto_id')
  @ApiOperation({ summary: 'Obtener un producto con sus catalogos (publico)' })
  obtener(@Param('producto_id', PipeId) id: number) {
    return this.productos.obtenerCompleto(id);
  }

  @Roles(...CAPACIDAD.catalogo)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear un producto' })
  crear(@Body() datos: CrearProductoDto) {
    return this.productos.crear(datos);
  }

  @Roles(...CAPACIDAD.catalogo)
  @ApiBearerAuth()
  @Put(':producto_id')
  @ApiOperation({ summary: 'Actualizar un producto' })
  actualizar(
    @Param('producto_id', PipeId) id: number,
    @Body() datos: ActualizarProductoDto,
  ) {
    return this.productos.actualizar(id, datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Delete(':producto_id')
  @ApiOperation({ summary: 'Eliminar un producto' })
  eliminar(@Param('producto_id', PipeId) id: number) {
    return this.productos.eliminar(id);
  }

  @Roles(...CAPACIDAD.catalogo)
  @ApiBearerAuth()
  @Post(':producto_id/foto')
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir la foto del producto (campo "archivo")' })
  subirFoto(
    @Param('producto_id', PipeId) id: number,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    if (!archivo) {
      throw new UnprocessableEntityException(
        'Falta el archivo en el campo "archivo"',
      );
    }
    return this.productos.cambiarFoto(id, archivo);
  }

  @Roles(...CAPACIDAD.catalogo)
  @ApiBearerAuth()
  @Delete(':producto_id/foto')
  @ApiOperation({ summary: 'Quitar la foto del producto' })
  quitarFoto(@Param('producto_id', PipeId) id: number) {
    return this.productos.quitarFoto(id);
  }
}
