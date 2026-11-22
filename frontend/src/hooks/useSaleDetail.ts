import { useMemo } from 'react';
import { saleService } from '../services/saleService';
import { queryKeys } from './core/keys';
import { combineQueries } from './core/useQuery';
import { useMutation } from './core/useMutation';
import { queryErrorMessage } from './core/errors';
import { useToday } from './core/useToday';
import { useClientsData, useSalesData } from './data';
import { buildSaleDetail, type SaleDetail } from './model/viewModels';

/** Tela da venda: valor, situação, parcelas, itens e exclusão. Para receber, use usePayment. */
export function useSaleDetail(saleId: number) {
  const today = useToday();
  const sales = useSalesData();
  const clients = useClientsData();
  const status = combineQueries(sales, clients);

  const details = sales.data?.find((s) => s.sale.saleId === saleId);
  const detail = useMemo<SaleDetail | undefined>(
    () => (details && clients.data ? buildSaleDetail(details, clients.data, today) : undefined),
    [details, clients.data, today],
  );

  const remove = useMutation(() => saleService.remove(saleId), [queryKeys.sales]);

  return {
    detail,
    notFound: sales.data !== undefined && !details,
    deleteSale: async () => (await remove.run()).ok,
    deleting: remove.loading,
    deleteError: remove.error,
    resetDeleteError: remove.reset,
    ...status,
    error: queryErrorMessage(status.error),
  };
}
