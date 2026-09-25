import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RecomendacionesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  sucursal_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  categoria_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  talla_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  preferencias?: string;
}

export class AsistenteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  mensaje: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sucursal_id?: number;
}

export class ReporteIaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  pregunta: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sucursal_id?: number;
}
