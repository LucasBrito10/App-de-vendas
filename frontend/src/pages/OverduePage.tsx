import { EmptyState, HelperText, OverdueCard, Page, StatCard, TopBar } from '../components';
import { useOverdue, usePayment } from '../hooks';
import { formatCurrency, formatOrdinal, formatSaleNumber, formatShortDate } from '../lib/format';
import { useGoBack } from './shared/navigation';
import { paths } from './shared/paths';
import { PaymentSheet } from './shared/PaymentSheet';
import { ScreenState } from './shared/ScreenState';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function OverduePage() {
  const goBack = useGoBack();
  const { summary, isEmpty, loading, error, reload } = useOverdue();
  const payment = usePayment();
  const target = payment.target;
  const targetClient = summary?.items.find((i) => i.installment.installmentId === target?.installmentId)?.clientName;

  return (
    <Page>
      <TopBar title="Atrasados" onNavigate={() => goBack(paths.home)} />
      <ScreenState loading={loading} error={error} hasData={!!summary} onRetry={reload}>
        {summary &&
          (isEmpty ? (
            <EmptyState title="Nenhuma parcela atrasada" description="Quando uma parcela passar do vencimento sem pagamento, ela aparece aqui." />
          ) : (
            <>
              <StatCard
                tone="warning"
                label="Total vencido"
                value={formatCurrency(summary.total)}
                caption={`${plural(summary.clientsCount, 'cliente', 'clientes')} · ${plural(summary.installmentsCount, 'parcela', 'parcelas')}`}
              />
              <HelperText>Mais antigas primeiro</HelperText>
              {summary.items.map((item) => (
                <OverdueCard
                  key={item.installment.installmentId}
                  clientName={item.clientName}
                  amount={formatCurrency(item.installment.amount)}
                  details={[
                    `Venda ${formatSaleNumber(item.saleId)}`,
                    item.installmentCount === 1 ? 'à vista' : `${formatOrdinal(item.installment.number)} de ${item.installmentCount}`,
                    `venceu ${formatShortDate(item.installment.dueDate)}`,
                  ].join(' · ')}
                  daysLate={item.daysLate}
                  chargeHref={item.chargeHref}
                  onReceive={() => payment.open(item.installment)}
                />
              ))}
              <HelperText>Uma parcela entra aqui quando passa do vencimento sem pagamento registrado.</HelperText>
            </>
          ))}
      </ScreenState>
      <PaymentSheet payment={payment} clientName={targetClient} />
    </Page>
  );
}
