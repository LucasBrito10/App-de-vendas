import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './SummaryStats.module.css';

export interface SummaryStat {
  label: ReactNode;
  value: ReactNode;
  /** Cor do valor: "open" deixa azul (Em aberto), "overdue" laranja. */
  tone?: 'default' | 'open' | 'overdue';
}

export interface SummaryStatsProps {
  items: SummaryStat[];
}

/** Faixa de números lado a lado no detalhe do cliente (Total comprado | Vendas | Em aberto). */
export function SummaryStats({ items }: SummaryStatsProps) {
  return (
    <dl className={styles.stats}>
      {items.map((item, index) => (
        <div key={index} className={styles.stat}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={cx(styles.value, item.tone && styles[item.tone])}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
