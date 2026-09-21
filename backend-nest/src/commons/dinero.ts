const FORMATO_MONTO = /^(-?)(\d+)(?:\.(\d+))?$/;

export function aCentavos(valor: string | number): number {
  const texto =
    typeof valor === 'number' ? valor.toFixed(2) : String(valor).trim();
  const partes = FORMATO_MONTO.exec(texto);
  if (!partes) {
    throw new Error(`Monto invalido: "${valor}"`);
  }

  const [, signo, enteros, decimales = ''] = partes;
  const centavos =
    Number(enteros) * 100 + Number(decimales.slice(0, 2).padEnd(2, '0'));
  return signo === '-' ? -centavos : centavos;
}

export function deCentavos(centavos: number): string {
  const enteros = Math.trunc(Math.abs(centavos) / 100);
  const resto = Math.abs(centavos) % 100;
  return `${centavos < 0 ? '-' : ''}${enteros}.${String(resto).padStart(2, '0')}`;
}

export function subtotalEnCentavos(
  precio: string | number,
  cantidad: number,
): number {
  return aCentavos(precio) * cantidad;
}
