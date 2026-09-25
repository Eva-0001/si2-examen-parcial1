import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../commons/decorators/roles.decorator.js';
import { Rol } from '../commons/enums/rol.enum.js';
import { PipeId } from '../commons/pipes.js';
import { FiltroBitacoraDto } from '../dto/bitacora.dto.js';
import { BitacoraService } from '../services/bitacora.service.js';

@ApiTags('Bitacora')
@ApiBearerAuth()
@Roles(Rol.ADMINISTRADOR)
@Controller('bitacora')
export class BitacoraController {
  constructor(private readonly bitacora: BitacoraService) {}

  @Get()
  @ApiOperation({
    summary: 'Movimientos de inventario, con filtros por encargado y fecha',
  })
  listar(@Query() filtro: FiltroBitacoraDto) {
    return this.bitacora.listar(filtro);
  }

  @Get(':bitacora_id')
  @ApiOperation({ summary: 'Obtener un registro de bitacora' })
  obtener(@Param('bitacora_id', PipeId) id: number) {
    return this.bitacora.obtener(id);
  }
}
