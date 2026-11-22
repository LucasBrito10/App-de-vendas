import type { Installment, IsoDate, SaleInput, SaleItemWithProduct, SaleWithDetails } from '../types/api';
import { endpoints } from './endpoints';
import { http } from './http';

export interface SalesQuery {
  clientId?: number;
  /** startDate e endDate andam juntos. */
  startDate?: IsoDate;
  endDate?: IsoDate;
}

export const saleService = {
  /** Mais recentes primeiro (data da compra desc, id desc). */
  list: (query: SalesQuery = {}, signal?: AbortSignal) =>
    http.get<SaleWithDetails[]>(endpoints.sales, { ...query }, signal),
  page: (page: number, size: number, query: SalesQuery = {}, signal?: AbortSignal) =>
    http.get<SaleWithDetails[]>(endpoints.sales, { ...query, page, size }, signal),
  get: (id: number, signal?: AbortSignal) => http.get<SaleWithDetails>(endpoints.sale(id), undefined, signal),
  items: (id: number, signal?: AbortSignal) => http.get<SaleItemWithProduct[]>(endpoints.saleItems(id), undefined, signal),
  installments: (id: number, signal?: AbortSignal) =>
    http.get<Installment[]>(endpoints.saleInstallments(id), undefined, signal),
  create: (input: SaleInput) => http.post<SaleWithDetails>(endpoints.sales, input),
  /** Venda não é editável: para corrigir, exclua e registre de novo. */
  remove: (id: number) => http.delete(endpoints.sale(id)),
};
