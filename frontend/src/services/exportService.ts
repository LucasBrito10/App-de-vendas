import type { ExportInstallmentStatus, ExportKind, IsoDate } from '../types/api';
import { endpoints } from './endpoints';
import { buildUrl } from './http';

export interface ExportQuery {
  clientId?: number;
  startDate?: IsoDate;
  endDate?: IsoDate;
  /** Só para kind = "installments". */
  status?: ExportInstallmentStatus;
}

export const exportService = {
  /**
   * URL do CSV. Não use fetch: o download só é salvo quando a WebView navega até ela
   * (LinkButton ou useExport().download).
   */
  url: (kind: ExportKind, query: ExportQuery = {}) => buildUrl(endpoints.export(kind), { ...query }),
};
