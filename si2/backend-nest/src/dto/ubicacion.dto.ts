import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ComoBooleano } from '../commons/pipes.js';
import {
  EsFecha,
  NoAnteriorA,
} from '../commons/validadores/fecha.validator.js';

export class CrearSucursalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ubicacion?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  foto?: string | null;

  @IsInt()
  @Min(1)
  ciudad_id: number;
}

export class ActualizarSucursalDto extends PartialType(CrearSucursalDto) {}

export class FiltroSucursalesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  ciudad_id?: number;
}

export class CrearPromocionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string | null;

  @EsFecha()
  fecha_inicio: string;

  @EsFecha()
  @NoAnteriorA('fecha_inicio', {
    message: 'fecha_final no puede ser anterior a fecha_inicio',
  })
  fecha_final: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  foto?: string | null;

  @IsInt()
  @Min(1)
  sucursal_id: number;
}

export class ActualizarPromocionDto extends PartialType(CrearPromocionDto) {}

export class FiltroPromocionesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  sucursal_id?: number;

  @IsOptional()
  @ComoBooleano()
  @IsBoolean()
  solo_vigentes?: boolean;
}
