import { Module } from '@nestjs/common';
import { ReportesController } from '../controllers/reportes.controller.js';
import { ReportesRepository } from '../repositories/reportes.repository.js';
import { ReportesService } from '../services/reportes.service.js';

@Module({
  controllers: [ReportesController],
  providers: [ReportesRepository, ReportesService],
  exports: [ReportesService, ReportesRepository],
})
export class ReportesModule {}
