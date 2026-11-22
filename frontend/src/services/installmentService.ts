import type { Installment, IsoDate, PaymentInput } from '../types/api';
import { endpoints } from './endpoints';
import { http } from './http';

export const installmentService = {
  get: (id: number, signal?: AbortSignal) => http.get<Installment>(endpoints.installment(id), undefined, signal),
  /** Não pagas com vencimento antes de hoje, mais antigas primeiro. Sem dados do cliente. */
  overdue: (signal?: AbortSignal) => http.get<Installment[]>(endpoints.overdueInstallments, undefined, signal),
  pending: (startDate: IsoDate, endDate: IsoDate, signal?: AbortSignal) =>
    http.get<Installment[]>(endpoints.pendingInstallments, { startDate, endDate }, signal),
  /** 409 se já estiver paga. Sem corpo: paga hoje pelo valor integral. */
  pay: (id: number, input: PaymentInput = {}) => http.post<Installment>(endpoints.installmentPayment(id), input),
  /** Desfaz o pagamento. 409 se não estiver paga. */
  cancelPayment: (id: number) => http.delete<Installment>(endpoints.installmentPayment(id)),
};
