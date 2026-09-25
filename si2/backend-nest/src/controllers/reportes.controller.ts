import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../commons/decorators/roles.decorator.js';
import { UsuarioActual } from '../commons/decorators/usuario-actual.decorator.js';
import { CAPACIDAD } from '../commons/enums/rol.enum.js';
import {
  FiltroReporteInventarioDto,
  FiltroReporteVentasDto,
} from '../dto/reporte.dto.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { ReportesService } from '../services/reportes.service.js';

@ApiTags('Reportes')
@ApiBearerAuth()
@Roles(...CAPACIDAD.reportes)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  @Get('ventas')
  @ApiOperation({
    summary: 'Ventas del periodo: totales, curva por dia y top de prendas',
  })
  async ventas(
    @Query() filtro: FiltroReporteVentasDto,
    @UsuarioActual() usuario: Usuario,
  ) {
    const sucursal_id = await this.reportes.sucursalPermitida(
      usuario,
      filtro.sucursal_id,
    );
    return this.reportes.ventas({ ...filtro, sucursal_id });
  }

  @Get('inventario')
  @ApiOperation({
    summary: 'Existencias consolidadas por sucursal y prendas por reponer',
  })
  async inventario(
    @Query() filtro: FiltroReporteInventarioDto,
    @UsuarioActual() usuario: Usuario,
  ) {
    const sucursal_id = await this.reportes.sucursalPermitida(
      usuario,
      filtro.sucursal_id,
    );
    return this.reportes.inventario({ ...filtro, sucursal_id });
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Indicadores del dia y del mes para la pantalla de inicio',
  })
  async dashboard(@UsuarioActual() usuario: Usuario) {
    return this.reportes.dashboard(
      await this.reportes.sucursalPermitida(usuario),
    );
  }
}
