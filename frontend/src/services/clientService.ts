import type { Client, ClientInput, ClientWithSales } from '../types/api';
import { endpoints } from './endpoints';
import { http } from './http';

export const clientService = {
  /** Todos, ordenados por nome. */
  list: (signal?: AbortSignal) => http.get<Client[]>(endpoints.clients, undefined, signal),
  /** Nome contém o texto. */
  listByName: (name: string, signal?: AbortSignal) => http.get<Client[]>(endpoints.clients, { name }, signal),
  /** Qualquer formatação de telefone; null se não achar. */
  findByPhone: (phone: string, signal?: AbortSignal) => http.get<Client | null>(endpoints.clients, { phone }, signal),
  page: (page: number, size: number, name?: string, signal?: AbortSignal) =>
    http.get<Client[]>(endpoints.clients, { page, size, name }, signal),
  get: (id: number, signal?: AbortSignal) => http.get<Client>(endpoints.client(id), undefined, signal),
  /** Vendas sem parcelas: para valores em aberto use saleService.list({ clientId }). */
  getWithSales: (id: number, signal?: AbortSignal) =>
    http.get<ClientWithSales>(endpoints.client(id), { withSales: true }, signal),
  create: (input: ClientInput) => http.post<Client>(endpoints.clients, input),
  /** Atualização parcial (só os campos enviados). */
  update: (id: number, input: ClientInput) => http.post<Client>(endpoints.client(id), input),
  /** Apaga também as vendas e parcelas do cliente. */
  remove: (id: number) => http.delete(endpoints.client(id)),
};
