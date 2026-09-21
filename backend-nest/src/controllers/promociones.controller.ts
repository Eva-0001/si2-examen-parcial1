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
import { Rol } from '../commons/enums/rol.enum.js';
import { PipeId } from '../commons/pipes.js';
import {
  ActualizarPromocionDto,
  CrearPromocionDto,
  FiltroPromocionesDto,
} from '../dto/ubicacion.dto.js';
import { PromocionesService } from '../services/promociones.service.js';

@ApiTags('Promociones')
@Controller('promociones')
export class PromocionesController {
  constructor(private readonly promociones: PromocionesService) {}

  @Publico()
  @Get()
  @ApiOperation({ summary: 'Listar promociones (publico)' })
  listar(@Query() filtro: FiltroPromocionesDto) {
    return this.promociones.listar(filtro);
  }

  @Publico()
  @Get(':promocion_id')
  @ApiOperation({ summary: 'Obtener una promocion con su sucursal (publico)' })
  obtener(@Param('promocion_id', PipeId) id: number) {
    return this.promociones.obtenerConSucursal(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear una promocion' })
  crear(@Body() datos: CrearPromocionDto) {
    return this.promociones.crear(datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Put(':promocion_id')
  @ApiOperation({ summary: 'Actualizar una promocion' })
  actualizar(
    @Param('promocion_id', PipeId) id: number,
    @Body() datos: ActualizarPromocionDto,
  ) {
    return this.promociones.actualizar(id, datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Delete(':promocion_id')
  @ApiOperation({ summary: 'Eliminar una promocion' })
  eliminar(@Param('promocion_id', PipeId) id: number) {
    return this.promociones.eliminar(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Post(':promocion_id/foto')
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir la foto de la promocion (campo "archivo")' })
  subirFoto(
    @Param('promocion_id', PipeId) id: number,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    if (!archivo) {
      throw new UnprocessableEntityException(
        'Falta el archivo en el campo "archivo"',
      );
    }
    return this.promociones.cambiarFoto(id, archivo);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Delete(':promocion_id/foto')
  @ApiOperation({ summary: 'Quitar la foto de la promocion' })
  quitarFoto(@Param('promocion_id', PipeId) id: number) {
    return this.promociones.quitarFoto(id);
  }
}
