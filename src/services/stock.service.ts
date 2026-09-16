import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ActualizarStockDto,
  CrearStockDto,
  FiltroStockDto,
} from '../dto/producto.dto.js';
import type { ProductoSucursal } from '../entities/producto-sucursal.entity.js';
import { StockRepository } from '../repositories/productos.repository.js';

const NO_ENCONTRADO = 'Registro de stock no encontrado';

@Injectable()
export class StockService {
  constructor(private readonly repo: StockRepository) {}

  listar(filtro: FiltroStockDto): Promise<ProductoSucursal[]> {
    return this.repo.listar(
      filtro.producto_id,
      filtro.sucursal_id,
      filtro.solo_disponibles ?? false,
    );
  }

  async obtener(id: number): Promise<ProductoSucursal> {
    const registro = await this.repo.obtener(id);
    if (!registro) throw new NotFoundException(NO_ENCONTRADO);
    return registro;
  }

  async obtenerCompleto(id: number): Promise<ProductoSucursal> {
    const registro = await this.repo.obtenerCompleto(id);
    if (!registro) throw new NotFoundException(NO_ENCONTRADO);
    return registro;
  }

  async crear(datos: CrearStockDto): Promise<ProductoSucursal> {
    if (!(await this.repo.existeProducto(datos.producto_id))) {
      throw new BadRequestException('El producto no existe');
    }
    if (!(await this.repo.existeSucursal(datos.sucursal_id))) {
      throw new BadRequestException('La sucursal no existe');
    }
    if (await this.repo.yaCargado(datos.producto_id, datos.sucursal_id)) {
      throw new ConflictException(
        'Ese producto ya tiene stock en esa sucursal, usa PUT para editarlo',
      );
    }

    return this.repo.crear({ ...datos, cantidad_reservada: 0 });
  }

  async actualizar(
    id: number,
    datos: ActualizarStockDto,
  ): Promise<ProductoSucursal> {
    const registro = await this.obtener(id);

    if (
      datos.cantidad !== undefined &&
      datos.cantidad < registro.cantidad_reservada
    ) {
      throw new ConflictException(
        `Hay ${registro.cantidad_reservada} unidad(es) reservadas: la cantidad no puede ` +
          'quedar por debajo de ese numero sin cancelar antes esas reservas',
      );
    }

    Object.assign(registro, datos);
    return this.repo.guardar(registro);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    await this.obtener(id);

    if (await this.repo.tieneMovimientos(id)) {
      throw new ConflictException(
        'No se puede eliminar el stock porque tiene ventas o reservas asociadas',
      );
    }

    await this.repo.eliminar(id);
    return { mensaje: 'Stock eliminado' };
  }
}
