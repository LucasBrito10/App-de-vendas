import { useMemo } from 'react';
import { combineQueries } from './core/useQuery';
import { queryErrorMessage } from './core/errors';
import { useToday } from './core/useToday';
import { useClientsData, useSalesData } from './data';
import { buildOverdue, type OverdueSummary } from './model/viewModels';

/** Tela Atrasados: total vencido e parcelas (mais antigas primeiro) com link de cobrança. */
export function useOverdue() {
  const today = useToday();
  const sales = useSalesData();
  const clients = useClientsData();
  const status = combineQueries(sales, clients);

  const summary = useMemo<OverdueSummary | undefined>(
    () => (sales.data && clients.data ? buildOverdue(sales.data, clients.data, today) : undefined),
    [sales.data, clients.data, today],
  );

  return { summary, isEmpty: summary?.items.length === 0, ...status, error: queryErrorMessage(status.error) };
}
