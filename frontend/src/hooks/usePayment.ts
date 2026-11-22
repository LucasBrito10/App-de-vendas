import { useState } from 'react';
import type { Installment } from '../types/api';
import { formatDecimal } from '../lib/format';
import { installmentService } from '../services/installmentService';
import { queryKeys } from './core/keys';
import { useMutation } from './core/useMutation';
import { useToday } from './core/useToday';
import { validatePaymentForm, type FieldErrors, type PaymentForm } from './model/validation';

/**
 * BottomSheet "Receber parcela" (tela da venda e tela Atrasados).
 *   const payment = usePayment();
 *   payment.open(installment)  → abre com valor integral e data de hoje
 *   payment.submit()           → valida, envia, fecha e atualiza as telas
 */
export function usePayment() {
  const today = useToday();
  const [target, setTarget] = useState<Installment | null>(null);
  const [form, setForm] = useState<PaymentForm>({ amount: '', paidAt: today });
  const [errors, setErrors] = useState<FieldErrors<keyof PaymentForm>>({});

  const pay = useMutation(
    (id: number, input: { paidAt?: string; paidAmount?: string }) => installmentService.pay(id, input),
    [queryKeys.sales],
  );
  const undo = useMutation((id: number) => installmentService.cancelPayment(id), [queryKeys.sales]);

  function open(installment: Installment) {
    setTarget(installment);
    setForm({ amount: formatDecimal(installment.amount), paidAt: today });
    setErrors({});
    pay.reset();
  }

  function close() {
    if (pay.loading) return;
    setTarget(null);
  }

  function setField<K extends keyof PaymentForm>(field: K, value: PaymentForm[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    pay.reset();
  }

  /** Resolve true se o pagamento foi registrado (o painel fecha sozinho). */
  async function submit(): Promise<boolean> {
    if (!target) return false;
    const result = validatePaymentForm(form, today);
    if (!result.ok) {
      setErrors(result.errors);
      return false;
    }
    const outcome = await pay.run(target.installmentId, {
      paidAt: result.value.paidAt,
      paidAmount: String(result.value.paidAmount),
    });
    if (outcome.ok) setTarget(null);
    return outcome.ok;
  }

  return {
    /** Parcela sendo recebida; null = painel fechado. */
    target,
    isOpen: target !== null,
    open,
    close,
    form,
    errors,
    setField,
    /** Data máxima do campo (não pode ser futura). */
    maxDate: today,
    submit,
    submitting: pay.loading,
    error: pay.error,
    /** Desfaz um pagamento registrado por engano. */
    cancelPayment: async (installmentId: number) => (await undo.run(installmentId)).ok,
    cancelling: undo.loading,
    cancelError: undo.error,
  };
}
