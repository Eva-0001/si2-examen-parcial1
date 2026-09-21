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
import { CAPACIDAD } from '../commons/enums/rol.enum.js';
import { PipeId } from '../commons/pipes.js';
import {
  ActualizarComprobanteDto,
  CrearComprobanteDto,
  FiltroComprobantesDto,
} from '../dto/comprobante.dto.js';
import { ComprobantesService } from '../services/comprobantes.service.js';

@ApiTags('Comprobantes')
@ApiBearerAuth()
@Controller('comprobantes')
export class ComprobantesController {
  constructor(private readonly comprobantes: ComprobantesService) {}

  @Roles(...CAPACIDAD.reportes)
  @Get()
  @ApiOperation({ summary: 'Listar comprobantes' })
  listar(@Query() filtro: FiltroComprobantesDto) {
    return this.comprobantes.listar(filtro);
  }

  @Roles(...CAPACIDAD.reportes)
  @Get(':comprobante_id')
  @ApiOperation({ summary: 'Obtener un comprobante' })
  obtener(@Param('comprobante_id', PipeId) id: number) {
    return this.comprobantes.obtener(id);
  }

  @Roles(...CAPACIDAD.caja)
  @Post()
  @ApiOperation({ summary: 'Emitir un comprobante' })
  crear(@Body() datos: CrearComprobanteDto) {
    return this.comprobantes.crear(datos);
  }

  @Roles(...CAPACIDAD.caja)
  @Put(':comprobante_id')
  @ApiOperation({ summary: 'Corregir un comprobante' })
  actualizar(
    @Param('comprobante_id', PipeId) id: number,
    @Body() datos: ActualizarComprobanteDto,
  ) {
    return this.comprobantes.actualizar(id, datos);
  }

  @Roles(...CAPACIDAD.caja)
  @Delete(':comprobante_id')
  @ApiOperation({ summary: 'Eliminar un comprobante' })
  eliminar(@Param('comprobante_id', PipeId) id: number) {
    return this.comprobantes.eliminar(id);
  }
}
