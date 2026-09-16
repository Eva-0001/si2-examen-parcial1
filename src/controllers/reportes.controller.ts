import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../commons/decorators/roles.decorator.js';
import { CAPACIDAD } from '../commons/enums/rol.enum.js';
import {
  FiltroReporteInventarioDto,
  FiltroReporteVentasDto,
} from '../dto/reporte.dto.js';
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
  ventas(@Query() filtro: FiltroReporteVentasDto) {
    return this.reportes.ventas(filtro);
  }

  @Get('inventario')
  @ApiOperation({
    summary: 'Existencias consolidadas por sucursal y prendas por reponer',
  })
  inventario(@Query() filtro: FiltroReporteInventarioDto) {
    return this.reportes.inventario(filtro);
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Indicadores del dia y del mes para la pantalla de inicio',
  })
  dashboard() {
    return this.reportes.dashboard();
  }
}
