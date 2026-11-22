import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Installment } from '../types/api';
import {
  AmountHeader,
  Button,
  ConfirmSheet,
  DangerZone,
  List,
  ListItem,
  Page,
  Section,
  StatusText,
  TopBar,
} from '../components';
import { usePayment, useSaleDetail, type InstallmentView } from '../hooks';
import { formatCurrency, formatDate, formatOrdinal, formatSaleNumber } from '../lib/format';
import { multiplyMoney } from '../lib/money';
import { parseId, useGoBack } from './shared/navigation';
import { paths } from './shared/paths';
import { PaymentSheet } from './shared/PaymentSheet';
import { ScreenState } from './shared/ScreenState';

function installmentSubtitle(i: InstallmentView): string {
  if (i.paidAt) {
    const partial = i.paidAmount != null && i.paidAmount !== i.amount ? ` · recebido ${formatCurrency(i.paidAmount)}` : '';
    return `Paga em ${formatDate(i.paidAt)}${partial}`;
  }
  if (i.status === 'overdue') return `Venceu em ${formatDate(i.dueDate)} · ${i.daysLate} ${i.daysLate === 1 ? 'dia' : 'dias'} de atraso`;
  return `Vence em ${formatDate(i.dueDate)}`;
}

export function SaleDetailPage() {
  const id = parseId(useParams().id);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const s = useSaleDetail(id ?? -1);
  const payment = usePayment();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [undoTarget, setUndoTarget] = useState<Installment | null>(null);
  const detail = s.detail;

  async function handleDelete() {
    if (await s.deleteSale()) goBack(paths.sales);
  }

  async function handleUndo() {
    if (undoTarget && (await payment.cancelPayment(undoTarget.installmentId))) setUndoTarget(null);
  }

  const single = detail?.installments.length === 1;

  return (
    <Page>
      <TopBar title={id ? `Venda ${formatSaleNumber(id)}` : 'Venda'} onNavigate={() => goBack(paths.sales)} />
      <ScreenState
        loading={s.loading}
        error={s.error}
        hasData={!!detail}
        notFound={id === null || s.notFound}
        notFoundTitle="Venda não encontrada"
        onRetry={s.reload}
      >
        {detail && (
          <>
            <AmountHeader
              amount={formatCurrency(detail.sale.totalPrice)}
              status={<StatusText status={detail.status} size="md" />}
              meta={
                <>
                  {formatDate(detail.sale.purchaseDate)} ·{' '}
                  {detail.client ? (
                    <Button
                      variant="link"
                      size="sm"
                      style={{ minHeight: 0, padding: 0, verticalAlign: 'baseline' }}
                      onClick={() => navigate(paths.client(detail.client!.clientId))}
                    >
                      {detail.client.name}
                    </Button>
                  ) : (
                    'Cliente removido'
                  )}
                </>
              }
            />

            <Section title="Parcelas" aside={`${detail.paidCount} de ${detail.installments.length} ${detail.installments.length === 1 ? 'paga' : 'pagas'}`}>
              <List>
                {detail.installments.map((i) => (
                  <ListItem
                    key={i.installmentId}
                    title={`${single ? 'À vista' : `${formatOrdinal(i.number)} parcela`} · ${formatCurrency(i.amount)}`}
                    subtitle={installmentSubtitle(i)}
                    action={
                      i.paidAt ? (
                        <Button variant="ghost" size="sm" onClick={() => setUndoTarget(i)}>
                          Desfazer
                        </Button>
                      ) : (
                        <Button variant="soft" size="sm" onClick={() => payment.open(i)}>
                          Receber
                        </Button>
                      )
                    }
                  />
                ))}
              </List>
            </Section>

            <Section title="Itens" aside={`${detail.units} ${detail.units === 1 ? 'unidade' : 'unidades'}`}>
              <List>
                {detail.items.map((item) => (
                  <ListItem
                    key={item.saleItemId}
                    title={item.productName}
                    subtitle={`${item.quantity} × ${formatCurrency(item.unitPrice)}`}
                    value={formatCurrency(multiplyMoney(item.unitPrice, item.quantity))}
                  />
                ))}
              </List>
            </Section>

            <DangerZone
              actionLabel="Excluir venda"
              onAction={() => setConfirmDelete(true)}
              description="Uma venda registrada não pode ser editada. Para corrigir, exclua e registre de novo."
            />

            <PaymentSheet payment={payment} clientName={detail.client?.name} />

            <ConfirmSheet
              open={confirmDelete}
              title={`Excluir venda ${formatSaleNumber(detail.sale.saleId)}?`}
              description="Os itens e as parcelas desta venda também serão apagados. Não dá para desfazer."
              confirmLabel="Excluir venda"
              loading={s.deleting}
              error={s.deleteError}
              onConfirm={() => void handleDelete()}
              onCancel={() => {
                setConfirmDelete(false);
                s.resetDeleteError();
              }}
            />

            <ConfirmSheet
              open={undoTarget !== null}
              title="Desfazer pagamento?"
              description={undoTarget ? `A ${formatOrdinal(undoTarget.number)} parcela volta a ficar em aberto.` : undefined}
              confirmLabel="Desfazer pagamento"
              loading={payment.cancelling}
              error={payment.cancelError}
              onConfirm={() => void handleUndo()}
              onCancel={() => setUndoTarget(null)}
            />
          </>
        )}
      </ScreenState>
    </Page>
  );
}
