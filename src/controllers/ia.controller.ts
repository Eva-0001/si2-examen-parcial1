import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Publico } from '../commons/decorators/publico.decorator.js';
import { Roles } from '../commons/decorators/roles.decorator.js';
import { UsuarioActual } from '../commons/decorators/usuario-actual.decorator.js';
import { CAPACIDAD, Rol } from '../commons/enums/rol.enum.js';
import {
  AsistenteDto,
  RecomendacionesDto,
  ReporteIaDto,
} from '../dto/ia.dto.js';
import type { Usuario } from '../entities/usuario.entity.js';
import { IaService } from '../services/ia.service.js';

@ApiTags('Inteligencia artificial')
@Controller('ia')
export class IaController {
  constructor(private readonly ia: IaService) {}

  @Publico()
  @Get('estado')
  @ApiOperation({ summary: 'Si el asistente esta configurado' })
  estado() {
    return this.ia.estado();
  }

  @Roles(Rol.CLIENTE, Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @Post('recomendaciones')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recomendador de prendas' })
  recomendaciones(
    @Body() datos: RecomendacionesDto,
    @UsuarioActual() cliente: Usuario,
  ) {
    return this.ia.recomendaciones(datos, cliente);
  }

  @ApiBearerAuth()
  @Post('asistente')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asistente de compra' })
  asistente(@Body() datos: AsistenteDto, @UsuarioActual() usuario: Usuario) {
    return this.ia.asistente(datos, usuario);
  }

  @Roles(...CAPACIDAD.reportes)
  @ApiBearerAuth()
  @Post('reportes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reporte generativo a partir de una pregunta' })
  reporte(@Body() datos: ReporteIaDto) {
    return this.ia.reporte(datos);
  }
}
