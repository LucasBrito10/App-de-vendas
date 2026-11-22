import { onlyDigits } from './text';

// Mesma regra do backend (shared/PhoneNumbers.java): só dígitos, DDD + 8 ou 9 dígitos, sem +55.
// Validar aqui evita a ida ao servidor só para receber um 400.

export const PHONE_ERROR = 'Telefone inválido. Informe o DDD e o número, ex.: (75) 99812-4410.';

/** Retorna os dígitos padronizados, null se vazio, ou undefined se inválido. */
export function normalizePhone(phone: string): string | null | undefined {
  let digits = onlyDigits(phone);
  if (!digits) return null;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2);
  if ((digits.length === 11 || digits.length === 12) && digits.startsWith('0')) digits = digits.slice(1);
  return digits.length === 10 || digits.length === 11 ? digits : undefined;
}
