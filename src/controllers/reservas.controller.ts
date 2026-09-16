import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../commons/decorators/roles.decorator.js';
import { UsuarioActual } from '../commons/decorators/usuario-actual.decorator.js';
import { CAPACIDAD, Rol } from '../commons/enums/rol.enum.js';
import { PipeId } from '../commons/pipes.js';
import {
  ActualizarReservaDto,
  CrearReservaDto,
  FiltroReservasDto,
} from '../dto/reserva.dto.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { ReservasService } from '../services/reservas.service.js';

@ApiTags('Reservas')
@ApiBearerAuth()
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservas: ReservasService) {}

  @Roles(...CAPACIDAD.reservas, Rol.CAJERO, Rol.CLIENTE)
  @Get()
  @ApiOperation({
    summary:
      'Listar reservas. El cliente solo ve las suyas; la sucursal filtra por sucursal_id',
  })
  listar(@Query() filtro: FiltroReservasDto, @UsuarioActual() actor: Usuario) {
    return this.reservas.listar(filtro, actor);
  }

  @Roles(...CAPACIDAD.reservas, Rol.CAJERO, Rol.CLIENTE)
  @Get(':reserva_id')
  @ApiOperation({ summary: 'Obtener una reserva con las prendas apartadas' })
  obtener(
    @Param('reserva_id', PipeId) id: number,
    @UsuarioActual() actor: Usuario,
  ) {
    return this.reservas.obtener(id, actor);
  }

  @Roles(...CAPACIDAD.reservas, Rol.CLIENTE)
  @Post()
  @ApiOperation({ summary: 'Reservar prendas para probarlas en una sucursal' })
  crear(@Body() datos: CrearReservaDto, @UsuarioActual() actor: Usuario) {
    return this.reservas.crear(datos, actor);
  }

  @Roles(...CAPACIDAD.reservas)
  @Patch(':reserva_id')
  @ApiOperation({
    summary:
      'Reprogramar o confirmar la asistencia (confirmarla libera el apartado)',
  })
  actualizar(
    @Param('reserva_id', PipeId) id: number,
    @Body() datos: ActualizarReservaDto,
    @UsuarioActual() actor: Usuario,
  ) {
    return this.reservas.actualizar(id, datos, actor);
  }

  @Roles(...CAPACIDAD.reservas, Rol.CLIENTE)
  @Delete(':reserva_id')
  @ApiOperation({
    summary: 'Cancelar una reserva y devolver las prendas al stock',
  })
  eliminar(
    @Param('reserva_id', PipeId) id: number,
    @UsuarioActual() actor: Usuario,
  ) {
    return this.reservas.eliminar(id, actor);
  }
}
