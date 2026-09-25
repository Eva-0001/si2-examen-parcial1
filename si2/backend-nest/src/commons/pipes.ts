import { HttpStatus, ParseIntPipe } from '@nestjs/common';
import { Transform } from 'class-transformer';

export const PipeId = new ParseIntPipe({
  errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
});

export const ComoBooleano = () =>
  Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'si', 'yes'].includes(String(value).toLowerCase());
  });

export const ComoMonto = () =>
  Transform(({ value }) => {
    if (typeof value === 'number' && Number.isFinite(value))
      return value.toFixed(2);
    if (typeof value === 'string') return value.trim();
    return value;
  });
