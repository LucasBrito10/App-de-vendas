// Monta, a partir das respostas da camada service, os dados que cada tela entrega aos components.
// Funções puras: sem React e sem rede.
import type { Client, Installment, IsoDate, Money, PaymentStatus, Sale, SaleItem, SaleWithDetails } from '../../types/api';
import { monthRange } from '../../lib/date';
import { sumMoney } from '../../lib/money';
import { daysLate, getInstallmentStatus, getSaleStatus, outstandingAmount, paidCount } from '../../lib/sale';
import { whatsappHref, reminderMessage } from './contact';
import { matchesSearch } from './text';

export interface SaleSummary {
  saleId: number;
  clientId: number;
  /** "Cliente removido" se o cliente não existir mais. */
  clientName: string;
  purchaseDate: IsoDate;
  total: Money;
  installmentCount: number;
  status: PaymentStatus;
  outstanding: Money;
}

export interface InstallmentView extends Installment {
  status: PaymentStatus;
  daysLate: number;
}

export interface SaleDetail {
  sale: Sale;
  client: Client | null;
  status: PaymentStatus;
  outstanding: Money;
  paidCount: number;
  installments: InstallmentView[];
  items: SaleItem[];
  units: number;
}

export interface ClientListItem {
  client: Client;
  hasOverdue: boolean;
}

export interface ClientDetail {
  client: Client;
  totalPurchased: Money;
  salesCount: number;
  outstanding: Money;
  hasOverdue: boolean;
  sales: SaleSummary[];
}

export interface OverdueItem {
  installment: Installment;
  saleId: number;
  installmentCount: number;
  clientId: number;
  clientName: string;
  clientPhone: string | null;
  daysLate: number;
  /** Link do WhatsApp com a mensagem de cobrança, ou null sem telefone. */
  chargeHref: string | null;
}

export interface OverdueSummary {
  total: Money;
  clientsCount: number;
  installmentsCount: number;
  /** Mais antigas primeiro. */
  items: OverdueItem[];
}

export interface DashboardSummary {
  monthTotal: Money;
  monthSalesCount: number;
  clientsCount: number;
  overdueClientsCount: number;
  overdueTotal: Money;
  recentSales: SaleSummary[];
}

export type SaleStatusFilter = 'all' | PaymentStatus;

const REMOVED_CLIENT = 'Cliente removido';

export function indexClients(clients: Client[]): Map<number, Client> {
  return new Map(clients.map((c) => [c.clientId, c]));
}

export function toSaleSummary(details: SaleWithDetails, clientsById: Map<number, Client>, today: IsoDate): SaleSummary {
  const { sale, installments } = details;
  return {
    saleId: sale.saleId,
    clientId: sale.clientId,
    clientName: clientsById.get(sale.clientId)?.name ?? REMOVED_CLIENT,
    purchaseDate: sale.purchaseDate,
    total: sale.totalPrice,
    installmentCount: installments.length,
    status: getSaleStatus(installments, today),
    outstanding: outstandingAmount(installments),
  };
}

export function buildSaleSummaries(sales: SaleWithDetails[], clients: Client[], today: IsoDate): SaleSummary[] {
  const byId = indexClients(clients);
  return sales.map((s) => toSaleSummary(s, byId, today));
}

export function filterSalesByStatus(sales: SaleSummary[], filter: SaleStatusFilter): SaleSummary[] {
  return filter === 'all' ? sales : sales.filter((s) => s.status === filter);
}

export function buildSaleDetail(details: SaleWithDetails, clients: Client[], today: IsoDate): SaleDetail {
  const installments = [...details.installments]
    .sort((a, b) => a.number - b.number)
    .map((i) => ({ ...i, status: getInstallmentStatus(i, today), daysLate: daysLate(i, today) }));
  const items = details.items.map((entry) => entry.item);
  return {
    sale: details.sale,
    client: indexClients(clients).get(details.sale.clientId) ?? null,
    status: getSaleStatus(details.installments, today),
    outstanding: outstandingAmount(details.installments),
    paidCount: paidCount(details.installments),
    installments,
    items,
    units: items.reduce((acc, i) => acc + i.quantity, 0),
  };
}

export function buildClientList(clients: Client[], sales: SaleWithDetails[], today: IsoDate, search = ''): ClientListItem[] {
  const overdue = new Set<number>();
  for (const { sale, installments } of sales) {
    if (installments.some((i) => getInstallmentStatus(i, today) === 'overdue')) overdue.add(sale.clientId);
  }
  return clients
    .filter((c) => matchesSearch(search, c.name, c.phone))
    .map((client) => ({ client, hasOverdue: overdue.has(client.clientId) }));
}

export function buildClientDetail(client: Client, sales: SaleWithDetails[], today: IsoDate): ClientDetail {
  const own = sales.filter((s) => s.sale.clientId === client.clientId);
  const byId = indexClients([client]);
  const summaries = own.map((s) => toSaleSummary(s, byId, today));
  return {
    client,
    totalPurchased: sumMoney(own.map((s) => s.sale.totalPrice)),
    salesCount: own.length,
    outstanding: sumMoney(summaries.map((s) => s.outstanding)),
    hasOverdue: summaries.some((s) => s.status === 'overdue'),
    sales: summaries,
  };
}

/**
 * Parcelas vencidas com os dados do cliente. Usa a mesma regra do endpoint
 * /sales/installments/overdue (não paga e vencimento antes de hoje), mas a partir da lista de vendas,
 * porque aquele endpoint não traz nome nem telefone do cliente.
 */
export function buildOverdue(sales: SaleWithDetails[], clients: Client[], today: IsoDate): OverdueSummary {
  const byId = indexClients(clients);
  const items: OverdueItem[] = [];
  for (const { sale, installments } of sales) {
    for (const installment of installments) {
      if (getInstallmentStatus(installment, today) !== 'overdue') continue;
      const client = byId.get(sale.clientId);
      const clientName = client?.name ?? REMOVED_CLIENT;
      items.push({
        installment,
        saleId: sale.saleId,
        installmentCount: installments.length,
        clientId: sale.clientId,
        clientName,
        clientPhone: client?.phone ?? null,
        daysLate: daysLate(installment, today),
        chargeHref: whatsappHref(client?.phone, reminderMessage(clientName, installment.amount, installment.dueDate)),
      });
    }
  }
  items.sort((a, b) => a.installment.dueDate.localeCompare(b.installment.dueDate) || a.saleId - b.saleId);
  return {
    total: sumMoney(items.map((i) => i.installment.amount)),
    clientsCount: new Set(items.map((i) => i.clientId)).size,
    installmentsCount: items.length,
    items,
  };
}

export function buildDashboard(sales: SaleWithDetails[], clients: Client[], today: IsoDate, recentCount = 3): DashboardSummary {
  const { startDate } = monthRange(today);
  const month = sales.filter((s) => s.sale.purchaseDate >= startDate && s.sale.purchaseDate <= today);
  const overdue = buildOverdue(sales, clients, today);
  const byId = indexClients(clients);
  return {
    monthTotal: sumMoney(month.map((s) => s.sale.totalPrice)),
    monthSalesCount: month.length,
    clientsCount: clients.length,
    overdueClientsCount: overdue.clientsCount,
    overdueTotal: overdue.total,
    // A API já devolve da mais recente para a mais antiga.
    recentSales: sales.slice(0, recentCount).map((s) => toSaleSummary(s, byId, today)),
  };
}
