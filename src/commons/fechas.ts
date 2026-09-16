export function aIsoSinZona(
  fecha: Date | string | null | undefined,
): string | null {
  if (fecha === null || fecha === undefined) return null;

  const valor = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(valor.getTime())) return null;

  const cero = (numero: number, largo = 2) =>
    String(numero).padStart(largo, '0');
  return (
    `${valor.getFullYear()}-${cero(valor.getMonth() + 1)}-${cero(valor.getDate())}` +
    `T${cero(valor.getHours())}:${cero(valor.getMinutes())}:${cero(valor.getSeconds())}` +
    `.${cero(valor.getMilliseconds(), 3)}`
  );
}
