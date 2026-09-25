import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../commons/decorators/roles.decorator.js';
import { Rol } from '../commons/enums/rol.enum.js';
import { PipeId } from '../commons/pipes.js';
import {
  ActualizarTrabajadorDto,
  CrearTrabajadorDto,
  FiltroTrabajadoresDto,
} from '../dto/trabajador.dto.js';
import { TrabajadoresService } from '../services/trabajadores.service.js';

@ApiTags('Trabajadores')
@ApiBearerAuth()
@Roles(Rol.ADMINISTRADOR)
@Controller('trabajadores')
export class TrabajadoresController {
  constructor(private readonly trabajadores: TrabajadoresService) {}

  @Get()
  @ApiOperation({ summary: 'Listar trabajadores' })
  listar(@Query() filtro: FiltroTrabajadoresDto) {
    return this.trabajadores.listar(filtro);
  }

  @Get(':trabajador_id')
  @ApiOperation({ summary: 'Obtener un trabajador con su rol y su sucursal' })
  obtener(@Param('trabajador_id', PipeId) id: number) {
    return this.trabajadores.obtenerDetalle(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Dar de alta un trabajador (crea tambien su usuario)',
  })
  crear(@Body() datos: CrearTrabajadorDto) {
    return this.trabajadores.crear(datos);
  }

  @Put(':trabajador_id')
  @ApiOperation({ summary: 'Actualizar un trabajador' })
  actualizar(
    @Param('trabajador_id', PipeId) id: number,
    @Body() datos: ActualizarTrabajadorDto,
  ) {
    return this.trabajadores.actualizar(id, datos);
  }

  @Delete(':trabajador_id')
  @ApiOperation({ summary: 'Eliminar un trabajador' })
  eliminar(@Param('trabajador_id', PipeId) id: number) {
    return this.trabajadores.eliminar(id);
  }
}
