import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasController } from '../controllers/categorias.controller.js';
import { ColeccionesController } from '../controllers/colecciones.controller.js';
import { ColoresController } from '../controllers/colores.controller.js';
import { ProveedoresController } from '../controllers/proveedores.controller.js';
import { TallasController } from '../controllers/tallas.controller.js';
import { TemporadasController } from '../controllers/temporadas.controller.js';
import { Categoria } from '../entities/categoria.entity.js';
import { Coleccion } from '../entities/coleccion.entity.js';
import { Color } from '../entities/color.entity.js';
import { Producto } from '../entities/producto.entity.js';
import { Proveedor } from '../entities/proveedor.entity.js';
import { Talla } from '../entities/talla.entity.js';
import { Temporada } from '../entities/temporada.entity.js';
import {
  CategoriasRepository,
  ColeccionesRepository,
  ColoresRepository,
  ProveedoresRepository,
  TallasRepository,
  TemporadasRepository,
} from '../repositories/catalogos.repository.js';
import {
  CategoriasService,
  ColeccionesService,
  ColoresService,
  ProveedoresService,
  TallasService,
  TemporadasService,
} from '../services/catalogos.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Categoria,
      Coleccion,
      Color,
      Talla,
      Temporada,
      Proveedor,
      Producto,
    ]),
  ],
  controllers: [
    CategoriasController,
    ColeccionesController,
    ColoresController,
    TallasController,
    TemporadasController,
    ProveedoresController,
  ],
  providers: [
    CategoriasRepository,
    ColeccionesRepository,
    ColoresRepository,
    TallasRepository,
    TemporadasRepository,
    ProveedoresRepository,
    CategoriasService,
    ColeccionesService,
    ColoresService,
    TallasService,
    TemporadasService,
    ProveedoresService,
  ],
  exports: [
    CategoriasService,
    ColeccionesService,
    ColoresService,
    TallasService,
    TemporadasService,
    ProveedoresService,
  ],
})
export class CatalogosModule {}
