import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ComoBooleano } from '../commons/pipes.js';
import { EsFecha, EsHora } from '../commons/validadores/fecha.validator.js';

export class DetalleDeReservaDto {
  @IsInt()
  @Min(1)
  producto_sucursal_id: number;

  @IsInt()
  @Min(1)
  cantidad: number;
}

export class CrearReservaDto {
  @EsFecha()
  fecha: string;

  @EsHora()
  hora: string;

  @IsInt()
  @Min(1)
  usuario_id: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DetalleDeReservaDto)
  @ApiProperty({ type: [DetalleDeReservaDto] })
  detalles: DetalleDeReservaDto[];

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    required: false,
    description:
      'Id generado por el cliente. Si se reenvia, se devuelve la misma reserva en vez de crear otra',
  })
  id_cliente?: string;
}

export class ActualizarReservaDto extends PartialType(
  PickType(CrearReservaDto, ['fecha', 'hora'] as const),
) {
  @IsOptional()
  @IsBoolean()
  asistencia?: boolean;
}

export class FiltroReservasDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  usuario_id?: number;

  @IsOptional()
  @ComoBooleano()
  @IsBoolean()
  asistencia?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  sucursal_id?: number;
}
