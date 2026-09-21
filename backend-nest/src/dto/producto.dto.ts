import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ComoBooleano, ComoMonto } from '../commons/pipes.js';

const MONTO = /^\d{1,8}(\.\d{1,2})?$/;

const MENSAJE_MONTO =
  'debe ser un monto positivo con hasta 2 decimales, por ejemplo "120.50"';

export class CrearProductoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  foto?: string | null;

  @ComoMonto()
  @Matches(MONTO, { message: `precio ${MENSAJE_MONTO}` })
  precio: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  categoria_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  coleccion_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  color_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  talla_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  temporada_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  proveedor_id?: number | null;
}

export class ActualizarProductoDto extends PartialType(CrearProductoDto) {}

export class FiltroProductosDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  categoria_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  coleccion_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  color_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  talla_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  temporada_id?: number;
}

export class CrearStockDto {
  @IsInt()
  @Min(0)
  cantidad: number;

  @ComoMonto()
  @Matches(MONTO, { message: `precio ${MENSAJE_MONTO}` })
  precio: string;

  @IsInt()
  @Min(1)
  producto_id: number;

  @IsInt()
  @Min(1)
  sucursal_id: number;
}

export class ActualizarStockDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  cantidad?: number;

  @IsOptional()
  @ComoMonto()
  @Matches(MONTO, { message: `precio ${MENSAJE_MONTO}` })
  precio?: string;
}

export class FiltroStockDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  producto_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sucursal_id?: number;

  @IsOptional()
  @ComoBooleano()
  @IsBoolean()
  solo_disponibles?: boolean;
}
