import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Alert.module.css';

export interface AlertProps {
  /** "error" para falhas da API (o texto de { error } do backend), "info" para avisos. */
  tone?: 'error' | 'info';
  title?: ReactNode;
  children: ReactNode;
  /** Botão opcional, ex.: <Button variant="link" size="sm" onClick={retry}>Tentar de novo</Button>. */
  action?: ReactNode;
}

/** Mensagem em bloco para erros de requisição (409 "Esta parcela já está paga.", falha de rede...). */
export function Alert({ tone = 'error', title, children, action }: AlertProps) {
  return (
    <div className={cx(styles.alert, styles[tone])} role={tone === 'error' ? 'alert' : 'status'}>
      <div className={styles.text}>
        {title && <strong className={styles.title}>{title}</strong>}
        <span>{children}</span>
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
