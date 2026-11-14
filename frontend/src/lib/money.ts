import type { Money } from '../types/api';

// O backend calcula com BigDecimal. No JS, somar 0.1 + 0.2 dá 0.30000000000000004,
// então toda conta de dinheiro no frontend é feita em centavos inteiros.

export function toCents(value: Money | string): number {
  return Math.round(Number(value) * 100);
}

export function fromCents(cents: number): Money {
  return cents / 100;
}

export function sumMoney(values: Array<Money | null | undefined>): Money {
  return fromCents(values.reduce<number>((acc, v) => acc + (v == null ? 0 : toCents(v)), 0));
}

export function multiplyMoney(unitPrice: Money, quantity: number): Money {
  return fromCents(toCents(unitPrice) * quantity);
}
