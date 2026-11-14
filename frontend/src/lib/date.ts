import type { IsoDate } from '../types/api';

// Datas do backend são "AAAA-MM-DD" sem fuso. Toda conta é feita em UTC sobre essas partes,
// para que o fuso do aparelho nunca desloque o dia (new Date("2026-11-13") seria meia-noite UTC,
// que no Brasil ainda é dia 12).

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcMs(iso: IsoDate): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Hoje no fuso do aparelho, igual ao LocalDate.now() do backend (que roda no mesmo aparelho).
 * Não use new Date().toISOString(): ela dá a data em UTC, que depois das 21h no Brasil já é amanhã.
 */
export function todayIso(now: Date = new Date()): IsoDate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  return fromUtcMs(toUtcMs(iso) + days * DAY_MS);
}

/** Dias de `from` até `to` (positivo se `to` for depois). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** Primeiro e último dia do mês de `iso` (para filtros "Este mês" / "Mês passado"). */
export function monthRange(iso: IsoDate, monthOffset = 0): { startDate: IsoDate; endDate: IsoDate } {
  const [y, m] = iso.split('-').map(Number);
  const start = Date.UTC(y, m - 1 + monthOffset, 1);
  const end = Date.UTC(y, m + monthOffset, 0);
  return { startDate: fromUtcMs(start), endDate: fromUtcMs(end) };
}
