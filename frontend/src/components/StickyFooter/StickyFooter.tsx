import type { ReactNode } from 'react';
import styles from './StickyFooter.module.css';

export interface StickyFooterProps {
  /** Linha de resumo acima do botão (ex.: "6 unidades" ... "R$ 203,20"). */
  summaryLabel?: ReactNode;
  summaryValue?: ReactNode;
  /** Normalmente um <Button block size="lg">. */
  children: ReactNode;
}

/** Rodapé fixo com a ação final da tela ("Salvar venda", "Nova venda para Carla"). */
export function StickyFooter({ summaryLabel, summaryValue, children }: StickyFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {(summaryLabel || summaryValue) && (
          <div className={styles.summary}>
            <span className={styles.summaryLabel}>{summaryLabel}</span>
            <strong className={styles.summaryValue} aria-live="polite">
              {summaryValue}
            </strong>
          </div>
        )}
        {children}
      </div>
    </footer>
  );
}
