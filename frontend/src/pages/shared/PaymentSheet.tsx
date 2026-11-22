import { Alert, BottomSheet, Button, TextField } from '../../components';
import { formatCurrency, formatOrdinal, formatSaleNumber } from '../../lib/format';
import type { usePayment } from '../../hooks';

export interface PaymentSheetProps {
  payment: ReturnType<typeof usePayment>;
  /** Nome do cliente para o subtítulo. */
  clientName?: string;
}

/** BottomSheet "Receber parcela" (telas Venda e Atrasados). */
export function PaymentSheet({ payment, clientName }: PaymentSheetProps) {
  const target = payment.target;
  const formId = 'payment-form';

  return (
    <BottomSheet
      open={payment.isOpen}
      onClose={payment.close}
      busy={payment.submitting}
      title={target ? `Receber ${formatOrdinal(target.number)} parcela` : ''}
      subtitle={
        target
          ? [`Venda ${formatSaleNumber(target.saleId)}`, clientName, formatCurrency(target.amount)].filter(Boolean).join(' · ')
          : undefined
      }
      footer={
        <>
          <Button type="submit" form={formId} block size="lg" loading={payment.submitting}>
            Confirmar pagamento
          </Button>
          <Button variant="ghost" block onClick={payment.close} disabled={payment.submitting}>
            Cancelar
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        style={{ display: 'contents' }}
        onSubmit={(event) => {
          event.preventDefault();
          void payment.submit();
        }}
      >
        <TextField
          label="Valor recebido (R$)"
          inputMode="decimal"
          emphasized
          value={payment.form.amount}
          onChange={(e) => payment.setField('amount', e.target.value)}
          error={payment.errors.amount}
        />
        <TextField
          label="Data do pagamento"
          type="date"
          max={payment.maxDate}
          value={payment.form.paidAt}
          onChange={(e) => payment.setField('paidAt', e.target.value)}
          hint="Não pode ser uma data futura."
          error={payment.errors.paidAt}
        />
        {payment.error && <Alert>{payment.error}</Alert>}
      </form>
    </BottomSheet>
  );
}
