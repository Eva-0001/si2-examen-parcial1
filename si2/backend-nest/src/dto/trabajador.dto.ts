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
import { EsFecha } from '../commons/validadores/fecha.validator.js';
import { CrearUsuarioDto } from './usuario.dto.js';

const MONTO = /^\d{1,8}(\.\d{1,2})?$/;

export class CrearTrabajadorDto extends CrearUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigo: string;

  @EsFecha()
  fecha_contrato: string;

  @ComoMonto()
  @Matches(MONTO, {
    message: 'sueldo debe ser un monto positivo con hasta 2 decimales',
  })
  sueldo: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sucursal_id?: number | null;
}

export class ActualizarTrabajadorDto extends PartialType(
  OmitType(CrearTrabajadorDto, ['password'] as const),
) {}

export class FiltroTrabajadoresDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  sucursal_id?: number;
}
