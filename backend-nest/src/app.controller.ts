import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';
import { Publico } from './commons/decorators/publico.decorator.js';

@ApiTags('Estado')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Publico()
  @Get()
  @ApiOperation({ summary: 'Verificar que la API responde' })
  estado() {
    return this.appService.estado();
  }
}
