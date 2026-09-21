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
  ActualizarSucursalDto,
  CrearSucursalDto,
  FiltroSucursalesDto,
} from '../dto/ubicacion.dto.js';
import { SucursalesService } from '../services/sucursales.service.js';

@ApiTags('Sucursales')
@Controller('sucursales')
export class SucursalesController {
  constructor(private readonly sucursales: SucursalesService) {}

  @Publico()
  @Get()
  @ApiOperation({ summary: 'Listar sucursales (publico)' })
  listar(@Query() filtro: FiltroSucursalesDto) {
    return this.sucursales.listar(filtro);
  }

  @Publico()
  @Get(':sucursal_id')
  @ApiOperation({ summary: 'Obtener una sucursal con su ciudad (publico)' })
  obtener(@Param('sucursal_id', PipeId) id: number) {
    return this.sucursales.obtenerConCiudad(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear una sucursal' })
  crear(@Body() datos: CrearSucursalDto) {
    return this.sucursales.crear(datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Put(':sucursal_id')
  @ApiOperation({ summary: 'Actualizar una sucursal' })
  actualizar(
    @Param('sucursal_id', PipeId) id: number,
    @Body() datos: ActualizarSucursalDto,
  ) {
    return this.sucursales.actualizar(id, datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Delete(':sucursal_id')
  @ApiOperation({ summary: 'Eliminar una sucursal' })
  eliminar(@Param('sucursal_id', PipeId) id: number) {
    return this.sucursales.eliminar(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Post(':sucursal_id/foto')
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir la foto de la sucursal (campo "archivo")' })
  subirFoto(
    @Param('sucursal_id', PipeId) id: number,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    if (!archivo) {
      throw new UnprocessableEntityException(
        'Falta el archivo en el campo "archivo"',
      );
    }
    return this.sucursales.cambiarFoto(id, archivo);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Delete(':sucursal_id/foto')
  @ApiOperation({ summary: 'Quitar la foto de la sucursal' })
  quitarFoto(@Param('sucursal_id', PipeId) id: number) {
    return this.sucursales.quitarFoto(id);
  }
}
