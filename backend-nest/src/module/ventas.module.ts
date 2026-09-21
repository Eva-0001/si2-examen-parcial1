import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComprobantesController } from '../controllers/comprobantes.controller.js';
import { PagosController } from '../controllers/pagos.controller.js';
import { VentasController } from '../controllers/ventas.controller.js';
import { Comprobante } from '../entities/comprobante.entity.js';
import { DetalleVenta } from '../entities/detalle-venta.entity.js';
import { ProductoSucursal } from '../entities/producto-sucursal.entity.js';
import { Usuario } from '../entities/usuario.entity.js';
import { Venta } from '../entities/venta.entity.js';
import { ComprobantesRepository } from '../repositories/comprobantes.repository.js';
import { VentasRepository } from '../repositories/ventas.repository.js';
import { ComprobantesService } from '../services/comprobantes.service.js';
import { PagosService } from '../services/pagos.service.js';
import { VentasService } from '../services/ventas.service.js';
import { BitacoraModule } from './bitacora.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Venta,
      DetalleVenta,
      Comprobante,
      ProductoSucursal,
      Usuario,
    ]),
    BitacoraModule,
  ],
  controllers: [VentasController, PagosController, ComprobantesController],
  providers: [
    VentasRepository,
    ComprobantesRepository,
    VentasService,
    PagosService,
    ComprobantesService,
  ],
  exports: [VentasService, PagosService],
})
export class VentasModule {}
