import { useMemo, useState } from 'react';
import type { ExportKind, IsoDate } from '../types/api';
import { monthRange } from '../lib/date';
import { exportService } from '../services/exportService';
import { useToday } from './core/useToday';

export type ExportPeriodPreset = 'this-month' | 'last-month' | 'custom';

export const EXPORT_PERIOD_OPTIONS: Array<{ value: ExportPeriodPreset; label: string }> = [
  { value: 'this-month', label: 'Este mês' },
  { value: 'last-month', label: 'Mês passado' },
  { value: 'custom', label: 'Outro período' },
];

/** Opções de "Incluir" da tela Exportar, cada uma vira um CSV. */
export const EXPORT_OPTIONS: Array<{ kind: ExportKind; title: string; description: string }> = [
  { kind: 'sales', title: 'Vendas', description: 'Número, data, cliente e total' },
  { kind: 'sale-items', title: 'Itens das vendas', description: 'Produto, quantidade e preço' },
  { kind: 'installments', title: 'Parcelas', description: 'Vencimento, valor e pagamento' },
];

export interface ExportPeriod {
  startDate: IsoDate;
  endDate: IsoDate;
}

/** "Este mês" vai do dia 1 até hoje (01/11/2026 a 14/11/2026), como no layout. */
export function resolvePeriod(preset: ExportPeriodPreset, today: IsoDate, custom: Partial<ExportPeriod>): ExportPeriod | string {
  if (preset === 'this-month') return { startDate: monthRange(today).startDate, endDate: today };
  if (preset === 'last-month') return monthRange(today, -1);
  if (!custom.startDate || !custom.endDate) return 'Informe a data inicial e a final.';
  if (custom.endDate < custom.startDate) return 'A data final não pode ser antes da inicial.';
  return { startDate: custom.startDate, endDate: custom.endDate };
}

/**
 * Abre cada URL por navegação, uma de cada vez: é o que aciona o DownloadListener do app Android.
 * (fetch não serve: o arquivo não seria salvo.)
 */
export async function triggerDownloads(urls: string[], delayMs = 600): Promise<void> {
  for (const [index, url] of urls.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = '';
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
}

/** Tela Exportar: período, o que incluir e o download dos CSVs. */
export function useExport() {
  const today = useToday();
  const [preset, setPreset] = useState<ExportPeriodPreset>('this-month');
  const [custom, setCustom] = useState<Partial<ExportPeriod>>({});
  const [selected, setSelected] = useState<Record<ExportKind, boolean>>({
    sales: true,
    'sale-items': true,
    installments: true,
    clients: false,
    products: false,
  });
  const [downloading, setDownloading] = useState(false);

  const resolved = useMemo(() => resolvePeriod(preset, today, custom), [preset, today, custom]);
  const period = typeof resolved === 'string' ? null : resolved;
  const periodError = typeof resolved === 'string' && preset === 'custom' && (custom.startDate || custom.endDate) ? resolved : null;

  const urls = useMemo(
    () =>
      period
        ? (Object.keys(selected) as ExportKind[])
            .filter((kind) => selected[kind])
            .map((kind) =>
              kind === 'clients' || kind === 'products'
                ? exportService.url(kind)
                : exportService.url(kind, { startDate: period.startDate, endDate: period.endDate }),
            )
        : [],
    [period, selected],
  );

  function toggle(kind: ExportKind, value?: boolean) {
    setSelected((s) => ({ ...s, [kind]: value ?? !s[kind] }));
  }

  async function download(): Promise<boolean> {
    if (urls.length === 0 || downloading) return false;
    setDownloading(true);
    try {
      await triggerDownloads(urls);
      return true;
    } finally {
      setDownloading(false);
    }
  }

  return {
    preset,
    setPreset,
    periodOptions: EXPORT_PERIOD_OPTIONS,
    custom,
    setCustomStart: (startDate: IsoDate) => setCustom((c) => ({ ...c, startDate })),
    setCustomEnd: (endDate: IsoDate) => setCustom((c) => ({ ...c, endDate })),
    maxDate: today,
    /** Período resolvido (para o texto "01/11/2026 a 14/11/2026"), ou null se incompleto. */
    period,
    periodError,
    options: EXPORT_OPTIONS,
    selected,
    toggle,
    /** URLs dos CSVs; com um só, pode ir direto num <LinkButton href>. */
    urls,
    canExport: urls.length > 0,
    download,
    downloading,
  };
}
