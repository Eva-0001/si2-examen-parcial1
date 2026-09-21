import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BitacoraController } from '../controllers/bitacora.controller.js';
import { Bitacora } from '../entities/bitacora.entity.js';
import { BitacoraRepository } from '../repositories/bitacora.repository.js';
import { BitacoraService } from '../services/bitacora.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Bitacora])],
  controllers: [BitacoraController],
  providers: [BitacoraRepository, BitacoraService],
  exports: [BitacoraService],
})
export class BitacoraModule {}
