import { useMemo, useState } from 'react';
import { combineQueries } from './core/useQuery';
import { queryErrorMessage } from './core/errors';
import { useToday } from './core/useToday';
import { useClientsData, useSalesData } from './data';
import { buildClientList, type ClientListItem } from './model/viewModels';

/** Tela Clientes: lista com busca por nome ou telefone e rótulo "Atrasado". */
export function useClients() {
  const today = useToday();
  const [search, setSearch] = useState('');
  const clients = useClientsData();
  const sales = useSalesData();
  const status = combineQueries(clients, sales);

  const items = useMemo<ClientListItem[]>(
    () => (clients.data ? buildClientList(clients.data, sales.data ?? [], today, search) : []),
    [clients.data, sales.data, today, search],
  );

  return {
    items,
    search,
    setSearch,
    totalCount: clients.data?.length ?? 0,
    /** Sem clientes cadastrados (diferente de busca sem resultado). */
    isEmpty: clients.data?.length === 0,
    // A lista aparece assim que os clientes chegam; o rótulo "Atrasado" entra quando as vendas chegarem.
    loading: clients.loading,
    refreshing: status.refreshing,
    error: queryErrorMessage(status.error),
    reload: status.reload,
  };
}
