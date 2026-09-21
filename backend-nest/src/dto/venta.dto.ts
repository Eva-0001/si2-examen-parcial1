import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { TipoVenta } from '../commons/enums/tipo-venta.enum.js';

export class DetalleDeVentaDto {
  @IsInt()
  @Min(1)
  producto_sucursal_id: number;

  @IsInt()
  @Min(1)
  cantidad: number;
}

export class CrearVentaDto {
  @IsEnum(TipoVenta)
  tipo_venta: TipoVenta;

  @IsInt()
  @Min(1)
  usuario_id: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DetalleDeVentaDto)
  @ApiProperty({ type: [DetalleDeVentaDto] })
  detalles: DetalleDeVentaDto[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^pi_[A-Za-z0-9_]+$/, {
    message:
      'pago_id debe ser el id de una intencion de pago de Stripe (pi_...)',
  })
  pago_id?: string;
}

export class ActualizarVentaDto extends PartialType(
  PickType(CrearVentaDto, ['tipo_venta'] as const),
) {}

export class FiltroVentasDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  usuario_id?: number;

  @IsOptional()
  @IsEnum(TipoVenta)
  tipo_venta?: TipoVenta;
}

export class CrearIntencionDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DetalleDeVentaDto)
  @ApiProperty({ type: [DetalleDeVentaDto] })
  detalles: DetalleDeVentaDto[];
}
