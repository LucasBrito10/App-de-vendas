// Validação dos formulários, espelhando as regras do backend para mostrar o erro no campo
// (TextField error) antes de enviar. O backend continua validando: se ele recusar, a mensagem
// dele aparece em Alert.
import type { ClientInput, IsoDate, PaymentInput, ProductInput, SaleInput } from '../../types/api';
import { parseDecimal } from '../../lib/format';
import { toCents } from '../../lib/money';
import { MAX_INSTALLMENTS } from '../../lib/sale';
import { normalizePhone, PHONE_ERROR } from './phone';

export type FieldErrors<F extends string> = Partial<Record<F, string>>;

export type ValidationResult<F extends string, V> =
  | { ok: true; value: V }
  | { ok: false; errors: FieldErrors<F> };

// ---------------------------------------------------------------- Cliente
export interface ClientForm {
  name: string;
  phone: string;
}

export function validateClientForm(form: ClientForm): ValidationResult<keyof ClientForm, ClientInput> {
  const errors: FieldErrors<keyof ClientForm> = {};
  const name = form.name.trim();
  if (!name) errors.name = 'Informe o nome.';
  const phone = normalizePhone(form.phone);
  if (phone === undefined) errors.phone = PHONE_ERROR;
  if (Object.keys(errors).length) return { ok: false, errors };
  // "" apaga o telefone na edição; no cadastro o backend trata "" como não informado.
  return { ok: true, value: { name, phone: phone ?? '' } };
}

// ---------------------------------------------------------------- Produto
export interface ProductForm {
  name: string;
  price: string;
}

export function validateProductForm(form: ProductForm): ValidationResult<keyof ProductForm, ProductInput> {
  const errors: FieldErrors<keyof ProductForm> = {};
  const name = form.name.trim();
  if (!name) errors.name = 'Informe o nome.';
  const price = parseDecimal(form.price);
  if (form.price.trim() === '') errors.price = 'Informe o preço.';
  else if (Number.isNaN(price)) errors.price = 'Preço inválido. Use, por exemplo, 59,90.';
  else if (price < 0) errors.price = 'O preço não pode ser negativo.';
  if (Object.keys(errors).length) return { ok: false, errors };
  // Texto com 2 casas: o BigDecimal recebe o valor exato, sem arredondamento de ponto flutuante.
  return { ok: true, value: { name, price: (toCents(price) / 100).toFixed(2) } };
}

// ---------------------------------------------------------------- Pagamento
export interface PaymentForm {
  amount: string;
  paidAt: IsoDate;
}

export function validatePaymentForm(form: PaymentForm, today: IsoDate): ValidationResult<keyof PaymentForm, PaymentInput> {
  const errors: FieldErrors<keyof PaymentForm> = {};
  const amount = parseDecimal(form.amount);
  if (form.amount.trim() === '' || Number.isNaN(amount)) errors.amount = 'Informe o valor recebido.';
  else if (toCents(amount) <= 0) errors.amount = 'O valor deve ser maior que zero.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.paidAt)) errors.paidAt = 'Informe a data do pagamento.';
  else if (form.paidAt > today) errors.paidAt = 'Não pode ser uma data futura.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { paidAt: form.paidAt, paidAmount: (toCents(amount) / 100).toFixed(2) } };
}

// ---------------------------------------------------------------- Venda
export interface SaleDraftState {
  clientId: number | null;
  /** productId → quantidade, na ordem em que foram adicionados. */
  lines: Array<{ productId: number; quantity: number }>;
  installmentCount: number;
}

export type SaleDraftField = 'client' | 'items' | 'installments';

export function validateSaleDraft(draft: SaleDraftState): ValidationResult<SaleDraftField, SaleInput> {
  const errors: FieldErrors<SaleDraftField> = {};
  if (draft.clientId == null) errors.client = 'Escolha o cliente.';
  const items = draft.lines.filter((l) => l.quantity > 0);
  if (items.length === 0) errors.items = 'Adicione pelo menos um item.';
  if (!Number.isInteger(draft.installmentCount) || draft.installmentCount < 1 || draft.installmentCount > MAX_INSTALLMENTS) {
    errors.installments = `Escolha de 1 a ${MAX_INSTALLMENTS} parcelas.`;
  }
  if (Object.keys(errors).length || draft.clientId == null) return { ok: false, errors };
  return {
    ok: true,
    value: {
      clientId: draft.clientId,
      installmentCount: draft.installmentCount,
      items: items.map(({ productId, quantity }) => ({ productId, quantity })),
    },
  };
}
