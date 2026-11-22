import { useNavigate } from 'react-router-dom';
import { ChipGroup, EmptyState, Fab, List, ListItem, Page, PageHeader, StatusText } from '../components';
import { useSales } from '../hooks';
import { formatCurrency, formatSaleNumber, formatShortDate } from '../lib/format';
import { describeInstallments } from '../lib/sale';
import { MainNav } from './shared/MainNav';
import { paths } from './shared/paths';
import { ScreenState } from './shared/ScreenState';

export function SalesPage() {
  const navigate = useNavigate();
  const { items, filter, setFilter, filterOptions, isEmpty, hasData, loading, error, reload } = useSales();

  return (
    <>
      <Page withBottomNav withFab>
        <PageHeader title="Vendas" />
        {!isEmpty && <ChipGroup label="Filtrar vendas" options={filterOptions} value={filter} onChange={setFilter} />}
        <ScreenState loading={loading} error={error} hasData={hasData} onRetry={reload} rows={6}>
          {isEmpty ? (
            <EmptyState title="Nenhuma venda registrada" description="Use o botão Nova venda para registrar a primeira." />
          ) : items.length === 0 ? (
            <EmptyState title="Nenhuma venda nesta situação" />
          ) : (
            <List>
              {items.map((sale) => (
                <ListItem
                  key={sale.saleId}
                  title={sale.clientName}
                  subtitle={`${formatSaleNumber(sale.saleId)} · ${formatShortDate(sale.purchaseDate)} · ${describeInstallments(sale.installmentCount)}`}
                  value={formatCurrency(sale.total)}
                  valueCaption={<StatusText status={sale.status} />}
                  onClick={() => navigate(paths.sale(sale.saleId))}
                />
              ))}
            </List>
          )}
        </ScreenState>
      </Page>
      <Fab onClick={() => navigate(paths.newSale({ fresh: true }))}>Nova venda</Fab>
      <MainNav />
    </>
  );
}
