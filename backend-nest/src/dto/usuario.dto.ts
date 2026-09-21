import { OmitType, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Genero } from '../commons/enums/genero.enum.js';

export class CrearUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellido: string;

  @IsEmail()
  @MaxLength(150)
  correo: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsOptional()
  @IsEnum(Genero)
  genero?: Genero | null;

  @IsInt()
  @Min(1)
  rol_id: number;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ActualizarUsuarioDto extends PartialType(
  OmitType(CrearUsuarioDto, ['password'] as const),
) {}

export class CambiarPasswordDto {
  @IsString()
  @IsNotEmpty()
  password_actual: string;

  @IsString()
  @IsNotEmpty()
  password_nuevo: string;
}

export class ResetearPasswordDto {
  @IsString()
  @IsNotEmpty()
  password_nuevo: string;
}

export class FiltroUsuariosDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  rol_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  buscar?: string;
}
