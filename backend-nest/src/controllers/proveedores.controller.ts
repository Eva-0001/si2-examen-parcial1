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
import {
  ActualizarProveedorDto,
  CrearProveedorDto,
} from '../dto/catalogos.dto.js';
import { ProveedoresService } from '../services/catalogos.service.js';

@ApiTags('Proveedores')
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedores: ProveedoresService) {}

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar proveedores' })
  listar() {
    return this.proveedores.listar();
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Get(':proveedor_id')
  @ApiOperation({ summary: 'Obtener un proveedor' })
  obtener(@Param('proveedor_id', PipeId) id: number) {
    return this.proveedores.obtener(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear un proveedor' })
  crear(@Body() datos: CrearProveedorDto) {
    return this.proveedores.crear(datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Put(':proveedor_id')
  @ApiOperation({ summary: 'Actualizar un proveedor' })
  actualizar(
    @Param('proveedor_id', PipeId) id: number,
    @Body() datos: ActualizarProveedorDto,
  ) {
    return this.proveedores.actualizar(id, datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Delete(':proveedor_id')
  @ApiOperation({ summary: 'Eliminar un proveedor' })
  eliminar(@Param('proveedor_id', PipeId) id: number) {
    return this.proveedores.eliminar(id);
  }
}
