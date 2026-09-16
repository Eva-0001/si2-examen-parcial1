import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArchivosModule } from '../commons/archivos/archivos.module.js';
import { ProductosController } from '../controllers/productos.controller.js';
import { StockController } from '../controllers/stock.controller.js';
import { Categoria } from '../entities/categoria.entity.js';
import { Coleccion } from '../entities/coleccion.entity.js';
import { Color } from '../entities/color.entity.js';
import { DetalleVenta } from '../entities/detalle-venta.entity.js';
import { Producto } from '../entities/producto.entity.js';
import { ProductoSucursal } from '../entities/producto-sucursal.entity.js';
import { Proveedor } from '../entities/proveedor.entity.js';
import { ReservaSucursal } from '../entities/reserva-sucursal.entity.js';
import { Sucursal } from '../entities/sucursal.entity.js';
import { Talla } from '../entities/talla.entity.js';
import { Temporada } from '../entities/temporada.entity.js';
import {
  ProductosRepository,
  StockRepository,
} from '../repositories/productos.repository.js';
import { ProductosService } from '../services/productos.service.js';
import { StockService } from '../services/stock.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      ProductoSucursal,
      Sucursal,
      DetalleVenta,
      ReservaSucursal,
      Categoria,
      Coleccion,
      Color,
      Talla,
      Temporada,
      Proveedor,
    ]),
    ArchivosModule,
  ],
  controllers: [ProductosController, StockController],
  providers: [
    ProductosRepository,
    StockRepository,
    ProductosService,
    StockService,
  ],
  exports: [ProductosService, StockService, StockRepository],
})
export class ProductosModule {}
