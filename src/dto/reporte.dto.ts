import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { EsFecha } from '../commons/validadores/fecha.validator.js';

export class FiltroReporteVentasDto {
  @IsOptional()
  @EsFecha()
  desde?: string;

  @IsOptional()
  @EsFecha()
  hasta?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sucursal_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  top?: number;
}

export class FiltroReporteInventarioDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  sucursal_id?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  umbral?: number;
}
