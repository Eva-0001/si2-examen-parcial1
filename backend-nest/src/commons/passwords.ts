import { compare, hash } from 'bcryptjs';

export function hashearPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export function verificarPassword(
  password: string,
  hashGuardado: string,
): Promise<boolean> {
  return compare(password, hashGuardado);
}
