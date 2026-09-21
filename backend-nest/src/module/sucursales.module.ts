import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArchivosModule } from '../commons/archivos/archivos.module.js';
import { CiudadesController } from '../controllers/ciudades.controller.js';
import { PromocionesController } from '../controllers/promociones.controller.js';
import { SucursalesController } from '../controllers/sucursales.controller.js';
import { Ciudad } from '../entities/ciudad.entity.js';
import { DetalleVenta } from '../entities/detalle-venta.entity.js';
import { Promocion } from '../entities/promocion.entity.js';
import { ReservaSucursal } from '../entities/reserva-sucursal.entity.js';
import { Sucursal } from '../entities/sucursal.entity.js';
import {
  CiudadesRepository,
  PromocionesRepository,
  SucursalesRepository,
} from '../repositories/ubicacion.repository.js';
import { CiudadesService } from '../services/ciudades.service.js';
import { PromocionesService } from '../services/promociones.service.js';
import { SucursalesService } from '../services/sucursales.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ciudad,
      Sucursal,
      Promocion,
      DetalleVenta,
      ReservaSucursal,
    ]),
    ArchivosModule,
  ],
  controllers: [
    CiudadesController,
    SucursalesController,
    PromocionesController,
  ],
  providers: [
    CiudadesRepository,
    SucursalesRepository,
    PromocionesRepository,
    CiudadesService,
    SucursalesService,
    PromocionesService,
  ],
  exports: [CiudadesService, SucursalesService, PromocionesService],
})
export class SucursalesModule {}
