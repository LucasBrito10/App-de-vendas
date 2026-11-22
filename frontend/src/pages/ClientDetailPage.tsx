import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  EmptyState,
  LinkButton,
  List,
  ListItem,
  Page,
  PageHeader,
  Section,
  StatGrid,
  StatusText,
  StickyFooter,
  SummaryStats,
  TopBar,
} from '../components';
import { useClientDetail } from '../hooks';
import { formatCurrency, formatDate, formatPhone, formatSaleNumber } from '../lib/format';
import { describeInstallments } from '../lib/sale';
import { parseId, useGoBack } from './shared/navigation';
import { paths } from './shared/paths';
import { ScreenState } from './shared/ScreenState';

export function ClientDetailPage() {
  const id = parseId(useParams().id);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { detail, notFound, callHref, whatsappHref, loading, error, reload } = useClientDetail(id ?? -1);
  const client = detail?.client;
  const firstName = client?.name.trim().split(/\s+/)[0];

  return (
    <>
      <Page withFooter={!!client}>
        <TopBar
          onNavigate={() => goBack(paths.clients)}
          action={client && <Button variant="link" onClick={() => navigate(paths.editClient(client.clientId))}>Editar</Button>}
        />
        <ScreenState
          loading={loading}
          error={error}
          hasData={!!detail}
          notFound={id === null || notFound}
          notFoundTitle="Cliente não encontrado"
          onRetry={reload}
        >
          {detail && client && (
            <>
              <PageHeader title={client.name} description={client.phone ? formatPhone(client.phone) : 'Sem telefone'} />
              <StatGrid>
                {callHref ? <LinkButton variant="secondary" block href={callHref}>Ligar</LinkButton> : <Button variant="secondary" block disabled>Ligar</Button>}
                {whatsappHref ? <LinkButton variant="secondary" block href={whatsappHref}>WhatsApp</LinkButton> : <Button variant="secondary" block disabled>WhatsApp</Button>}
              </StatGrid>
              <SummaryStats
                items={[
                  { label: 'Total comprado', value: formatCurrency(detail.totalPurchased) },
                  { label: 'Vendas', value: detail.salesCount },
                  {
                    label: 'Em aberto',
                    value: formatCurrency(detail.outstanding),
                    tone: detail.hasOverdue ? 'overdue' : detail.outstanding > 0 ? 'open' : 'default',
                  },
                ]}
              />
              <Section title="Vendas">
                {detail.sales.length === 0 ? (
                  <EmptyState title="Nenhuma venda para este cliente" />
                ) : (
                  <List>
                    {detail.sales.map((sale) => (
                      <ListItem
                        key={sale.saleId}
                        title={formatDate(sale.purchaseDate)}
                        subtitle={`${formatSaleNumber(sale.saleId)} · ${describeInstallments(sale.installmentCount)}`}
                        value={formatCurrency(sale.total)}
                        valueCaption={<StatusText status={sale.status} />}
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
      {client && (
        <StickyFooter>
          <Button block size="lg" onClick={() => navigate(paths.newSale({ clientId: client.clientId }))}>
            Nova venda para {firstName}
          </Button>
        </StickyFooter>
      )}
    </>
  );
}
