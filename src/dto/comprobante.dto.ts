import { OmitType, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ComoMonto } from '../commons/pipes.js';

const MONTO = /^\d{1,8}(\.\d{1,2})?$/;

export class CrearComprobanteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @IsInt()
  @Min(1)
  cantidad: number;

  @ComoMonto()
  @Matches(MONTO, {
    message: 'monto debe ser un monto positivo con hasta 2 decimales',
  })
  monto: string;

  @IsInt()
  @Min(1)
  venta_id: number;
}

export class ActualizarComprobanteDto extends PartialType(
  OmitType(CrearComprobanteDto, ['venta_id'] as const),
) {}

export class FiltroComprobantesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  venta_id?: number;
}
