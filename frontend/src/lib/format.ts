const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 342.5 → "R$ 342,50" (com espaço normal, não o NBSP do Intl). */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value == null || value === '' || Number.isNaN(Number(value))) return '—';
  return currencyFormatter.format(Number(value)).replace(/\u00a0/g, ' ');
}

/** 342.5 → "342,50" (para campos de valor). */
export function formatDecimal(value: number | string): string {
  return numberFormatter.format(Number(value));
}

/** "2026-11-13" → "13/11/2026". Só reordena o texto, então o fuso nunca muda o dia. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

/** "2026-11-13" → "13/11". */
export function formatShortDate(isoDate: string): string {
  return formatDate(isoDate).slice(0, 5);
}

/** 19 → "#0019". */
export function formatSaleNumber(id: number): string {
  return `#${String(id).padStart(4, '0')}`;
}

/** "75998124410" → "(75) 99812-4410". */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

/**
 * Lê o que a pessoa digitou num campo de valor. Retorna NaN se não for um número válido.
 *   "114,18" → 114.18   "1.234,56" → 1234.56   "114.18" → 114.18   "1.234" → 1234
 */
export function parseDecimal(input: string): number {
  const trimmed = input.trim().replace(/^R\$\s*/, '');
  if (trimmed === '') return NaN;
  let normalized: string;
  if (trimmed.includes(',')) {
    // Com vírgula, o ponto é separador de milhar.
    normalized = trimmed.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    // "1.234" no Brasil é mil duzentos e trinta e quatro, não 1,234.
    normalized = trimmed.replace(/\./g, '');
  } else {
    normalized = trimmed;
  }
  return /^-?\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}

/** "Hoje", "Ontem" ou "12/11" — como na lista de últimas vendas. */
export function formatRelativeDay(isoDate: string, todayIsoDate: string): string {
  const date = isoDate.slice(0, 10);
  if (date === todayIsoDate) return 'Hoje';
  const [y, m, d] = todayIsoDate.split('-').map(Number);
  const yesterday = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
  if (date === yesterday) return 'Ontem';
  return formatShortDate(date);
}

/** "1ª", "2ª"... */
export function formatOrdinal(n: number): string {
  return `${n}ª`;
}
