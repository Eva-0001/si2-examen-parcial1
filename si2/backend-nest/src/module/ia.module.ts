import { Module } from '@nestjs/common';
import { IaController } from '../controllers/ia.controller.js';
import { IaService } from '../services/ia.service.js';
import { ReportesModule } from './reportes.module.js';

@Module({
  imports: [ReportesModule],
  controllers: [IaController],
  providers: [IaService],
  exports: [IaService],
})
export class IaModule {}
