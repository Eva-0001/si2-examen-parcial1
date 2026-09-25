import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function esFechaReal(valor: string): boolean {
  if (!FORMATO_FECHA.test(valor)) return false;

  const [anio, mes, dia] = valor.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  );
}

export function EsFecha(opciones?: ValidationOptions) {
  return function (objeto: object, propiedad: string): void {
    registerDecorator({
      name: 'esFecha',
      target: objeto.constructor,
      propertyName: propiedad,
      options: opciones,
      validator: {
        validate: (valor: unknown) =>
          typeof valor === 'string' && esFechaReal(valor),
        defaultMessage: () =>
          'la fecha debe tener el formato YYYY-MM-DD y ser valida',
      },
    });
  };
}

export function EsHora(opciones?: ValidationOptions) {
  return function (objeto: object, propiedad: string): void {
    registerDecorator({
      name: 'esHora',
      target: objeto.constructor,
      propertyName: propiedad,
      options: opciones,
      validator: {
        validate: (valor: unknown) =>
          typeof valor === 'string' && FORMATO_HORA.test(valor),
        defaultMessage: () => 'la hora debe tener el formato HH:MM o HH:MM:SS',
      },
    });
  };
}

export function NoAnteriorA(campoInicio: string, opciones?: ValidationOptions) {
  return function (objeto: object, propiedad: string): void {
    registerDecorator({
      name: 'noAnteriorA',
      target: objeto.constructor,
      propertyName: propiedad,
      constraints: [campoInicio],
      options: opciones,
      validator: {
        validate(valor: unknown, args: ValidationArguments): boolean {
          const inicio = (args.object as Record<string, unknown>)[campoInicio];
          if (typeof valor !== 'string' || typeof inicio !== 'string')
            return true;
          return valor >= inicio;
        },
        defaultMessage: (args?: ValidationArguments) =>
          `${args?.property ?? 'la fecha final'} no puede ser anterior a ${campoInicio}`,
      },
    });
  };
}
