import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Espaçamento interno. "none" para quando o conteúdo já tem padding (listas). */
  padding?: 'none' | 'md' | 'lg';
}

/** Superfície branca com borda e cantos arredondados, base dos blocos do app. */
export function Card({ padding = 'md', className, ...rest }: CardProps) {
  return <div className={cx(styles.card, styles[`padding-${padding}`], className)} {...rest} />;
}
