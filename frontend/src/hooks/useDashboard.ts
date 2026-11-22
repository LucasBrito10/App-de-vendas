import { useMemo } from 'react';
import { combineQueries } from './core/useQuery';
import { queryErrorMessage } from './core/errors';
import { useToday } from './core/useToday';
import { useClientsData, useSalesData } from './data';
import { buildDashboard, type DashboardSummary } from './model/viewModels';

/** Tela Início: vendido no mês, clientes, atrasados e últimas vendas. */
export function useDashboard() {
  const today = useToday();
  const sales = useSalesData();
  const clients = useClientsData();
  const status = combineQueries(sales, clients);

  const summary = useMemo<DashboardSummary | undefined>(
    () => (sales.data && clients.data ? buildDashboard(sales.data, clients.data, today) : undefined),
    [sales.data, clients.data, today],
  );

  return { summary, today, ...status, error: queryErrorMessage(status.error) };
}
