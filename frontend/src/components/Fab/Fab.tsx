import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import styles from './Fab.module.css';

export interface FabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Sobe o botão para não ficar atrás da BottomNav. Padrão: true. */
  aboveBottomNav?: boolean;
}

/** Botão flutuante de ação principal da tela ("Nova venda"). */
export function Fab({ aboveBottomNav = true, type = 'button', className, children, ...rest }: FabProps) {
  return (
    <button
      type={type}
      className={cx(styles.fab, aboveBottomNav && styles.aboveNav, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
