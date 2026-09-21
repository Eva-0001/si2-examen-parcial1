import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Publico } from '../commons/decorators/publico.decorator.js';
import { Roles } from '../commons/decorators/roles.decorator.js';
import { CAPACIDAD } from '../commons/enums/rol.enum.js';
import { PipeId } from '../commons/pipes.js';
import {
  ActualizarStockDto,
  CrearStockDto,
  FiltroStockDto,
} from '../dto/producto.dto.js';
import { StockService } from '../services/stock.service.js';

@ApiTags('Stock por sucursal')
@Controller('stock')
export class StockController {
  constructor(private readonly stock: StockService) {}

  @Publico()
  @Get()
  @ApiOperation({
    summary:
      'Disponibilidad por sucursal (publico). Incluye el campo disponible',
  })
  listar(@Query() filtro: FiltroStockDto) {
    return this.stock.listar(filtro);
  }

  @Publico()
  @Get(':stock_id')
  @ApiOperation({ summary: 'Obtener un registro de stock (publico)' })
  obtener(@Param('stock_id', PipeId) id: number) {
    return this.stock.obtenerCompleto(id);
  }

  @Roles(...CAPACIDAD.inventario)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Cargar stock de un producto en una sucursal' })
  crear(@Body() datos: CrearStockDto) {
    return this.stock.crear(datos);
  }

  @Roles(...CAPACIDAD.inventario)
  @ApiBearerAuth()
  @Put(':stock_id')
  @ApiOperation({ summary: 'Actualizar cantidad o precio del stock' })
  actualizar(
    @Param('stock_id', PipeId) id: number,
    @Body() datos: ActualizarStockDto,
  ) {
    return this.stock.actualizar(id, datos);
  }

  @Roles(...CAPACIDAD.inventario)
  @ApiBearerAuth()
  @Delete(':stock_id')
  @ApiOperation({ summary: 'Eliminar un registro de stock' })
  eliminar(@Param('stock_id', PipeId) id: number) {
    return this.stock.eliminar(id);
  }
}
