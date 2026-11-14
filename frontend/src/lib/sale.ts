// Regras de venda/parcela espelhadas do backend (SaleService), para a tela mostrar
// exatamente o que o servidor vai gravar. Se mudar lá, mude aqui.
import type { Installment, IsoDate, Money, PaymentStatus, SaleWithDetails } from '../types/api';
import { addDays, daysBetween } from './date';
import { fromCents, toCents } from './money';

/** SaleService.MAX_INSTALLMENTS */
export const MAX_INSTALLMENTS = 120;
/** SaleService.DAYS_BETWEEN_INSTALLMENTS */
export const DAYS_BETWEEN_INSTALLMENTS = 30;

/** Parcela vencida = não paga e vencimento ANTES de hoje (mesma regra da consulta "overdue"). */
export function getInstallmentStatus(installment: Installment, today: IsoDate): PaymentStatus {
  if (installment.paidAt != null) return 'paid';
  return installment.dueDate < today ? 'overdue' : 'open';
}

/** Venda: atrasada se alguma parcela estiver vencida; paga se todas pagas; senão em aberto. */
export function getSaleStatus(installments: Installment[], today: IsoDate): PaymentStatus {
  const statuses = installments.map((i) => getInstallmentStatus(i, today));
  if (statuses.includes('overdue')) return 'overdue';
  if (statuses.length > 0 && statuses.every((s) => s === 'paid')) return 'paid';
  return 'open';
}

export function daysLate(installment: Installment, today: IsoDate): number {
  return Math.max(0, daysBetween(installment.dueDate, today));
}

/** Soma do que ainda não foi pago (para "Em aberto" e "Total vencido"). */
export function outstandingAmount(installments: Installment[], onlyOverdueOn?: IsoDate): Money {
  const cents = installments
    .filter((i) => i.paidAt == null && (onlyOverdueOn == null || i.dueDate < onlyOverdueOn))
    .reduce((acc, i) => acc + toCents(i.amount), 0);
  return fromCents(cents);
}

export function paidCount(installments: Installment[]): number {
  return installments.filter((i) => i.paidAt != null).length;
}

/** "à vista" ou "3 parcelas". */
export function describeInstallments(count: number): string {
  return count <= 1 ? 'à vista' : `${count} parcelas`;
}

export interface InstallmentPreview {
  number: number;
  amount: Money;
  dueDate: IsoDate;
}

/**
 * Mesmo cálculo de SaleService.buildInstallments: divide arredondando para baixo e põe a sobra
 * de centavos na 1ª parcela; a parcela N vence 30 × N dias após a compra.
 * Ex.: R$ 203,20 em 3x → 67,74 + 67,73 + 67,73.
 */
export function previewInstallments(total: Money, count: number, purchaseDate: IsoDate): InstallmentPreview[] {
  const totalCents = toCents(total);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return {
      number,
      amount: fromCents(number === 1 ? base + remainder : base),
      dueDate: addDays(purchaseDate, DAYS_BETWEEN_INSTALLMENTS * number),
    };
  });
}

/** Clientes com pelo menos uma parcela vencida (para o rótulo "Atrasado" na lista). */
export function overdueClientIds(sales: SaleWithDetails[], today: IsoDate): Set<number> {
  const ids = new Set<number>();
  for (const { sale, installments } of sales) {
    if (installments.some((i) => getInstallmentStatus(i, today) === 'overdue')) ids.add(sale.clientId);
  }
  return ids;
}
