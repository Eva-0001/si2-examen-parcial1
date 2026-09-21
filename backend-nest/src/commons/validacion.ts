import {
  UnprocessableEntityException,
  type ValidationError,
} from '@nestjs/common';

interface ErrorDeCampo {
  loc: string[];
  msg: string;
  type: string;
}

function aplanar(errores: ValidationError[], camino: string[]): ErrorDeCampo[] {
  return errores.flatMap((error) => {
    const actual = [...camino, error.property];
    const propios = Object.values(error.constraints ?? {}).map((mensaje) => ({
      loc: actual,
      msg: mensaje,
      type: 'value_error',
    }));
    const hijos = aplanar(error.children ?? [], actual);
    return [...propios, ...hijos];
  });
}

export function fabricaDeErroresDeValidacion(errores: ValidationError[]) {
  return new UnprocessableEntityException({
    detail: aplanar(errores, ['body']),
  });
}
