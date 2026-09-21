import { PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearCategoriaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;
}

export class ActualizarCategoriaDto extends PartialType(CrearCategoriaDto) {}

export class CrearColeccionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string | null;
}

export class ActualizarColeccionDto extends PartialType(CrearColeccionDto) {}

export class CrearColorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre: string;
}

export class ActualizarColorDto extends PartialType(CrearColorDto) {}

export class CrearTallaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nombre: string;
}

export class ActualizarTallaDto extends PartialType(CrearTallaDto) {}

export class CrearTemporadaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre: string;
}

export class ActualizarTemporadaDto extends PartialType(CrearTemporadaDto) {}

export class CrearProveedorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  encargado?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string | null;
}

export class ActualizarProveedorDto extends PartialType(CrearProveedorDto) {}

export class CrearCiudadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;
}

export class ActualizarCiudadDto extends PartialType(CrearCiudadDto) {}

export class CrearRolDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre: string;
}

export class ActualizarRolDto extends PartialType(CrearRolDto) {}

export class FiltroPorSucursalDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  sucursal_id?: number;
}
