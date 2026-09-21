import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasController } from '../controllers/reservas.controller.js';
import { ProductoSucursal } from '../entities/producto-sucursal.entity.js';
import { Reserva } from '../entities/reserva.entity.js';
import { ReservaSucursal } from '../entities/reserva-sucursal.entity.js';
import { Usuario } from '../entities/usuario.entity.js';
import { ReservasRepository } from '../repositories/reservas.repository.js';
import { ReservasService } from '../services/reservas.service.js';
import { BitacoraModule } from './bitacora.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reserva,
      ReservaSucursal,
      ProductoSucursal,
      Usuario,
    ]),
    BitacoraModule,
  ],
  controllers: [ReservasController],
  providers: [ReservasRepository, ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}
