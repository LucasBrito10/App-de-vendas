import type { Product, ProductInput } from '../types/api';
import { endpoints } from './endpoints';
import { http } from './http';

export const productService = {
  list: (signal?: AbortSignal) => http.get<Product[]>(endpoints.products, undefined, signal),
  listByName: (name: string, signal?: AbortSignal) => http.get<Product[]>(endpoints.products, { name }, signal),
  page: (page: number, size: number, name?: string, signal?: AbortSignal) =>
    http.get<Product[]>(endpoints.products, { page, size, name }, signal),
  get: (id: number, signal?: AbortSignal) => http.get<Product>(endpoints.product(id), undefined, signal),
  create: (input: ProductInput) => http.post<Product>(endpoints.products, input),
  update: (id: number, input: ProductInput) => http.post<Product>(endpoints.product(id), input),
  /** Vendas antigas mantêm nome e preço do produto. */
  remove: (id: number) => http.delete(endpoints.product(id)),
};
