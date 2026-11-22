import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, Fab, List, ListItem, Page, PageHeader, Section, StatCard, StatGrid, StatusText } from '../components';
import { useDashboard } from '../hooks';
import { formatCurrency, formatRelativeDay } from '../lib/format';
import { describeInstallments } from '../lib/sale';
import { MainNav } from './shared/MainNav';
import { paths } from './shared/paths';
import { ScreenState } from './shared/ScreenState';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function HomePage() {
  const navigate = useNavigate();
  const { summary, today, loading, error, reload } = useDashboard();

  return (
    <>
      <Page withBottomNav withFab>
        <PageHeader title="Início" />
        <ScreenState loading={loading} error={error} hasData={!!summary} onRetry={reload} rows={4}>
          {summary && (
            <>
              <StatCard
                tone="highlight"
                size="lg"
                label="Vendido no mês"
                value={formatCurrency(summary.monthTotal)}
                caption={`${plural(summary.monthSalesCount, 'venda registrada', 'vendas registradas')}`}
              />
              <StatGrid>
                <StatCard label="Clientes" value={summary.clientsCount} onClick={() => navigate(paths.clients)} />
                {summary.overdueClientsCount > 0 ? (
                  <StatCard
                    tone="warning"
                    label="Atrasados"
                    value={plural(summary.overdueClientsCount, 'cliente', 'clientes')}
                    caption={`${formatCurrency(summary.overdueTotal)} vencidos`}
                    onClick={() => navigate(paths.overdue)}
                  />
                ) : (
                  <StatCard label="Atrasados" value="Nenhum" caption="Tudo em dia" />
                )}
              </StatGrid>
              <Section
                title="Últimas vendas"
                aside={
                  summary.recentSales.length > 0 && (
                    <Button variant="link" size="sm" onClick={() => navigate(paths.sales)}>
                      Ver todas
                    </Button>
                  )
                }
              >
                {summary.recentSales.length === 0 ? (
                  <EmptyState
                    title="Nenhuma venda ainda"
                    description="Registre a primeira venda pelo botão Nova venda."
                  />
                ) : (
                  <List>
                    {summary.recentSales.map((sale) => (
                      <ListItem
                        key={sale.saleId}
                        title={sale.clientName}
                        subtitle={`${formatRelativeDay(sale.purchaseDate, today)} · ${describeInstallments(sale.installmentCount)}`}
                        value={formatCurrency(sale.total)}
                        valueCaption={sale.status !== 'paid' && <StatusText status={sale.status} />}
                        onClick={() => navigate(paths.sale(sale.saleId))}
                      />
                    ))}
                  </List>
                )}
              </Section>
            </>
          )}
        </ScreenState>
      </Page>
      <Fab onClick={() => navigate(paths.newSale({ fresh: true }))}>Nova venda</Fab>
      <MainNav />
    </>
  );
}
