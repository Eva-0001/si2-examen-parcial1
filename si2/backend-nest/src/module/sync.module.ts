import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from '../controllers/sync.controller.js';
import { Reserva } from '../entities/reserva.entity.js';
import { Venta } from '../entities/venta.entity.js';
import { SyncRepository } from '../repositories/sync.repository.js';
import { SyncService } from '../services/sync.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva, Venta])],
  controllers: [SyncController],
  providers: [SyncRepository, SyncService],
})
export class SyncModule {}
