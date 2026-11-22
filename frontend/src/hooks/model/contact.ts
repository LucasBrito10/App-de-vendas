import type { Money } from '../../types/api';
import { formatCurrency, formatShortDate } from '../../lib/format';
import { normalizePhone } from './phone';

// Links abertos pelo app Android (MainActivity libera só tel: e wa.me).

/** "tel:+5575998124410", ou null se o cliente não tem telefone válido. */
export function phoneHref(phone: string | null | undefined): string | null {
  const digits = phone ? normalizePhone(phone) : null;
  return digits ? `tel:+55${digits}` : null;
}

/** Conversa no WhatsApp com mensagem opcional já escrita. */
export function whatsappHref(phone: string | null | undefined, message?: string): string | null {
  const digits = phone ? normalizePhone(phone) : null;
  if (!digits) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/55${digits}${text}`;
}

/** Mensagem do botão "Cobrar". */
export function reminderMessage(clientName: string, amount: Money, dueDate: string): string {
  const firstName = clientName.trim().split(/\s+/)[0] ?? clientName;
  return `Oi, ${firstName}! Tudo bem? Passando para lembrar da parcela de ${formatCurrency(amount)} que venceu em ${formatShortDate(dueDate)}. Qualquer coisa, me avise!`;
}
