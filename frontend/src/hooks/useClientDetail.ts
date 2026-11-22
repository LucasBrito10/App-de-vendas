import { useMemo } from 'react';
import { combineQueries } from './core/useQuery';
import { queryErrorMessage } from './core/errors';
import { useToday } from './core/useToday';
import { useClientsData, useSalesData } from './data';
import { phoneHref, whatsappHref } from './model/contact';
import { buildClientDetail, type ClientDetail } from './model/viewModels';

/** Tela do cliente: totais, vendas e links de Ligar / WhatsApp. */
export function useClientDetail(clientId: number) {
  const today = useToday();
  const clients = useClientsData();
  const sales = useSalesData();
  const status = combineQueries(clients, sales);

  const client = clients.data?.find((c) => c.clientId === clientId);
  const detail = useMemo<ClientDetail | undefined>(
    () => (client && sales.data ? buildClientDetail(client, sales.data, today) : undefined),
    [client, sales.data, today],
  );

  return {
    detail,
    /** Cliente não existe (apagado ou id inválido). */
    notFound: clients.data !== undefined && !client,
    callHref: phoneHref(client?.phone),
    whatsappHref: whatsappHref(client?.phone),
    ...status,
    error: queryErrorMessage(status.error),
  };
}
