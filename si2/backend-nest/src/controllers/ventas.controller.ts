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
import { UsuarioActual } from '../commons/decorators/usuario-actual.decorator.js';
import { CAPACIDAD, Rol } from '../commons/enums/rol.enum.js';
import { PipeId } from '../commons/pipes.js';
import {
  ActualizarVentaDto,
  CrearVentaDto,
  FiltroVentasDto,
} from '../dto/venta.dto.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { VentasService } from '../services/ventas.service.js';

@ApiTags('Ventas')
@ApiBearerAuth()
@Controller('ventas')
export class VentasController {
  constructor(private readonly ventas: VentasService) {}

  @Roles(...CAPACIDAD.reportes, Rol.CLIENTE)
  @Get()
  @ApiOperation({ summary: 'Listar ventas. El cliente solo ve las suyas' })
  listar(@Query() filtro: FiltroVentasDto, @UsuarioActual() actor: Usuario) {
    return this.ventas.listar(filtro, actor);
  }

  @Roles(...CAPACIDAD.reportes, Rol.CLIENTE)
  @Get(':venta_id')
  @ApiOperation({ summary: 'Obtener una venta con su detalle' })
  obtener(
    @Param('venta_id', PipeId) id: number,
    @UsuarioActual() actor: Usuario,
  ) {
    return this.ventas.obtener(id, actor);
  }

  @Roles(...CAPACIDAD.venta)
  @Post()
  @ApiOperation({
    summary:
      'Registrar una venta. La compra del cliente exige pago por la pasarela',
  })
  crear(@Body() datos: CrearVentaDto, @UsuarioActual() actor: Usuario) {
    return this.ventas.crear(datos, actor);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Put(':venta_id')
  @ApiOperation({ summary: 'Corregir el tipo de una venta' })
  actualizar(
    @Param('venta_id', PipeId) id: number,
    @Body() datos: ActualizarVentaDto,
  ) {
    return this.ventas.actualizar(id, datos);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Delete(':venta_id')
  @ApiOperation({ summary: 'Anular una venta y devolver el stock' })
  anular(
    @Param('venta_id', PipeId) id: number,
    @UsuarioActual() actor: Usuario,
  ) {
    return this.ventas.anular(id, actor);
  }
}
