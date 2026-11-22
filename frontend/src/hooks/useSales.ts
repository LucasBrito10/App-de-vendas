import { useMemo, useState } from 'react';
import { combineQueries } from './core/useQuery';
import { queryErrorMessage } from './core/errors';
import { useToday } from './core/useToday';
import { useClientsData, useSalesData } from './data';
import { buildSaleSummaries, filterSalesByStatus, type SaleStatusFilter, type SaleSummary } from './model/viewModels';

/** Opções do ChipGroup da tela Vendas. */
export const SALE_FILTER_OPTIONS: Array<{ value: SaleStatusFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'open', label: 'Em aberto' },
  { value: 'overdue', label: 'Atrasadas' },
  { value: 'paid', label: 'Pagas' },
];

/** Tela Vendas: lista com filtro por situação. */
export function useSales(initialFilter: SaleStatusFilter = 'all') {
  const today = useToday();
  const [filter, setFilter] = useState<SaleStatusFilter>(initialFilter);
  const sales = useSalesData();
  const clients = useClientsData();
  const status = combineQueries(sales, clients);

  const all = useMemo<SaleSummary[]>(
    () => (sales.data && clients.data ? buildSaleSummaries(sales.data, clients.data, today) : []),
    [sales.data, clients.data, today],
  );
  const items = useMemo(() => filterSalesByStatus(all, filter), [all, filter]);

  return {
    items,
    filter,
    setFilter,
    filterOptions: SALE_FILTER_OPTIONS,
    /** Nenhuma venda registrada (diferente de filtro sem resultado). */
    isEmpty: sales.data?.length === 0,
    /** Listas já carregadas (mesmo que vazias). */
    hasData: sales.data !== undefined && clients.data !== undefined,
    ...status,
    error: queryErrorMessage(status.error),
  };
}
