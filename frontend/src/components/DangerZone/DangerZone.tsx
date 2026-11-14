import type { ReactNode } from 'react';
import { Button } from '../Button';
import styles from './DangerZone.module.css';

export interface DangerZoneProps {
  /** Texto do botão ("Excluir venda", "Excluir cliente"). */
  actionLabel: string;
  onAction: () => void;
  /** Explicação da consequência ("Apaga também as 4 vendas..."). */
  description?: ReactNode;
  /** Empurra o bloco para o fim da tela (formulários de edição). */
  pushToBottom?: boolean;
  loading?: boolean;
}

/** Ação destrutiva com explicação, no fim das telas de detalhe/edição. */
export function DangerZone({ actionLabel, onAction, description, pushToBottom, loading }: DangerZoneProps) {
  return (
    <div className={pushToBottom ? `${styles.zone} ${styles.bottom}` : styles.zone}>
      <Button variant="danger" onClick={onAction} loading={loading} className={styles.button}>
        {actionLabel}
      </Button>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
}
