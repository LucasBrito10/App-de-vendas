// Caminhos da API (relativos a /api/v1). Fonte: ApiDispatcher e controllers do backend.
// Detalhes de parâmetros e respostas estão documentados em types/api.ts.
import type { ExportKind } from '../types/api';

export const endpoints = {
  clients: '/clients',
  client: (id: number) => `/clients/${id}`,

  products: '/products',
  product: (id: number) => `/products/${id}`,

  sales: '/sales',
  sale: (id: number) => `/sales/${id}`,
  saleItems: (id: number) => `/sales/${id}/items`,
  saleInstallments: (id: number) => `/sales/${id}/installments`,

  installment: (id: number) => `/sales/installments/${id}`,
  installmentPayment: (id: number) => `/sales/installments/${id}/payment`,
  overdueInstallments: '/sales/installments/overdue',
  pendingInstallments: '/sales/installments/pending',

  export: (kind: ExportKind) => `/export/${kind}`,
} as const;
