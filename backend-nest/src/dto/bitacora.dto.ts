import { IsOptional, IsString, MaxLength } from 'class-validator';
import { EsFecha } from '../commons/validadores/fecha.validator.js';

export class FiltroBitacoraDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  encargado?: string;

  @IsOptional()
  @EsFecha()
  desde?: string;

  @IsOptional()
  @EsFecha()
  hasta?: string;
}
