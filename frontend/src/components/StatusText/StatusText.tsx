import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import type { PaymentStatus } from '../../types/api';
import styles from './StatusText.module.css';

export type { PaymentStatus };

const DEFAULT_LABELS: Record<PaymentStatus, string> = {
  paid: 'Paga',
  open: 'Em aberto',
  overdue: 'Atrasada',
};

export interface StatusTextProps {
  status: PaymentStatus;
  /** Sobrescreve o texto padrão (ex.: "Atrasado" para cliente, "12 dias de atraso"). */
  children?: ReactNode;
  size?: 'sm' | 'md';
}

/** Rótulo colorido do estado de pagamento: Paga (cinza), Em aberto (azul), Atrasada (laranja). */
export function StatusText({ status, children, size = 'sm' }: StatusTextProps) {
  return (
    <span className={cx(styles.status, styles[status], styles[size])}>
      {children ?? DEFAULT_LABELS[status]}
    </span>
  );
}
