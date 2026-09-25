import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Publico } from '../commons/decorators/publico.decorator.js';
import { UsuarioActual } from '../commons/decorators/usuario-actual.decorator.js';
import { FiltroSyncDto } from '../dto/sync.dto.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { SyncService } from '../services/sync.service.js';

@ApiTags('Sincronizacion')
@Controller('sync')
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Publico()
  @Get('catalogo')
  @ApiOperation({
    summary:
      'Cambios del catalogo (productos, stock, sucursales y catalogos) desde una fecha, para la copia local del movil',
  })
  catalogo(@Query() filtro: FiltroSyncDto) {
    return this.sync.catalogo(filtro.desde);
  }

  @ApiBearerAuth()
  @Get('mis-datos')
  @ApiOperation({
    summary:
      'Reservas y compras del usuario autenticado cambiadas desde una fecha',
  })
  misDatos(@Query() filtro: FiltroSyncDto, @UsuarioActual() usuario: Usuario) {
    return this.sync.misDatos(usuario, filtro.desde);
  }
}
