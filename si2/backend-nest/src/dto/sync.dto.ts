import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class FiltroSyncDto {
  @IsOptional()
  @IsISO8601({ strict: true })
  @ApiProperty({
    required: false,
    description:
      'El valor "hasta" de la sincronizacion anterior. Sin el, se devuelve la copia completa',
  })
  desde?: string;
}
