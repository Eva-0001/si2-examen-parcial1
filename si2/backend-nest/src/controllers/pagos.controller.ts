import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Publico } from '../commons/decorators/publico.decorator.js';
import { Roles } from '../commons/decorators/roles.decorator.js';
import { UsuarioActual } from '../commons/decorators/usuario-actual.decorator.js';
import { CAPACIDAD } from '../commons/enums/rol.enum.js';
import { CrearIntencionDto } from '../dto/venta.dto.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { PagosService } from '../services/pagos.service.js';
import { VentasService } from '../services/ventas.service.js';

@ApiTags('Pagos')
@Controller('pagos')
export class PagosController {
  constructor(
    private readonly pagos: PagosService,
    private readonly ventas: VentasService,
  ) {}

  @Publico()
  @Get('config')
  @ApiOperation({
    summary:
      'Le dice al frontend si puede ofrecer pago con tarjeta. No expone claves',
  })
  configuracion() {
    return this.pagos.configuracion();
  }

  @Roles(...CAPACIDAD.venta)
  @ApiBearerAuth()
  @Post('intencion')
  @ApiOperation({
    summary: 'Crear la intencion de pago por el total real del carrito',
  })
  async crearIntencion(
    @Body() datos: CrearIntencionDto,
    @UsuarioActual() actor: Usuario,
  ) {
    this.pagos.exigirPasarela();

    const total = await this.ventas.totalDe(datos.detalles);
    return this.pagos.crearIntencion(total, actor);
  }
}
