import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import styles from './HelperText.module.css';

/** Texto explicativo pequeno e cinza ("Mais antigas primeiro", "6 produtos", notas de rodapé). */
export function HelperText({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx(styles.helper, className)} {...rest} />;
}
