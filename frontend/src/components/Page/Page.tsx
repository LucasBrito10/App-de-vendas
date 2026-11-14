import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import styles from './Page.module.css';

export interface PageProps extends HTMLAttributes<HTMLElement> {
  /** Reserva espaço embaixo para a BottomNav. */
  withBottomNav?: boolean;
  /** Reserva espaço embaixo para um StickyFooter. */
  withFooter?: boolean;
  /** Reserva espaço embaixo para o Fab não cobrir o fim da lista. */
  withFab?: boolean;
}

/** Contêiner de cada tela: fundo, margens laterais e espaçamento vertical entre blocos. */
export function Page({ withBottomNav, withFooter, withFab, className, children, ...rest }: PageProps) {
  return (
    <main
      className={cx(
        styles.page,
        withBottomNav && styles.withBottomNav,
        withFooter && styles.withFooter,
        withFab && styles.withFab,
        className,
      )}
      {...rest}
    >
      {children}
    </main>
  );
}
