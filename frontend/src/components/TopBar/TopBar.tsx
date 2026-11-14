import type { ReactNode } from 'react';
import { IconButton } from '../IconButton';
import styles from './TopBar.module.css';

export interface TopBarProps {
  title?: ReactNode;
  /**
   * "back" = seta (telas de detalhe: cliente, venda, atrasados).
   * "close" = X (formulários: novo/editar cliente, produto, venda).
   */
  navigation?: 'back' | 'close';
  onNavigate?: () => void;
  /** Ação à direita: <Button variant="link">Editar</Button> ou <Button size="sm">Salvar</Button>. */
  action?: ReactNode;
}

/** Barra superior das telas internas (fora da BottomNav). */
export function TopBar({ title, navigation = 'back', onNavigate, action }: TopBarProps) {
  return (
    <header className={styles.topBar}>
      {onNavigate && (
        <IconButton
          icon={navigation === 'back' ? 'chevronLeft' : 'close'}
          label={navigation === 'back' ? 'Voltar' : 'Fechar'}
          onClick={onNavigate}
          className={styles.nav}
        />
      )}
      {title && <h1 className={styles.title}>{title}</h1>}
      {action && <div className={styles.action}>{action}</div>}
    </header>
  );
}
