import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './StatCard.module.css';

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  /** Linha extra abaixo do valor ("20 vendas registradas", "R$ 196,10 vencidos"). */
  caption?: ReactNode;
  /**
   * "highlight" = verde cheio (Vendido no mês)
   * "default"   = branco (Clientes)
   * "warning"   = laranja claro (Atrasados, Total vencido)
   */
  tone?: 'default' | 'highlight' | 'warning';
  /** "lg" para o cartão principal do topo. */
  size?: 'md' | 'lg';
  /** Torna o cartão clicável (ex.: Atrasados → tela de atrasados). */
  onClick?: () => void;
}

/** Cartão de indicador do painel inicial. */
export function StatCard({ label, value, caption, tone = 'default', size = 'md', onClick }: StatCardProps) {
  const className = cx(styles.card, styles[tone], styles[size], onClick && styles.clickable);
  const content = (
    <>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {caption && <span className={styles.caption}>{caption}</span>}
    </>
  );

  return onClick ? (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

/** Grade de 2 colunas para StatCards lado a lado. */
export function StatGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}
