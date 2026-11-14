import type { ReactNode } from 'react';
import styles from './AmountHeader.module.css';

export interface AmountHeaderProps {
  /** Valor grande ("R$ 342,50"). */
  amount: ReactNode;
  /** Ao lado do valor, normalmente <StatusText size="md">. */
  status?: ReactNode;
  /** Linha abaixo ("13/11/2026 · Carla Menezes"). */
  meta?: ReactNode;
}

/** Cabeçalho do detalhe da venda: valor total, estado e dados da venda. */
export function AmountHeader({ amount, status, meta }: AmountHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.line}>
        <span className={styles.amount}>{amount}</span>
        {status}
      </div>
      {meta && <div className={styles.meta}>{meta}</div>}
    </div>
  );
}
