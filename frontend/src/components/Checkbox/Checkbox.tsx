import { forwardRef, type InputHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { Icon } from '../Icon';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

/**
 * Caixa de seleção estilizada (input nativo por baixo, então funciona com teclado e leitores de tela).
 * Envolva-a num <label> junto do texto, como faz o <CheckboxListItem>.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ className, ...rest }, ref) {
  return (
    <span className={cx(styles.wrapper, className)}>
      <input ref={ref} type="checkbox" className={styles.input} {...rest} />
      <span className={styles.box} aria-hidden>
        <Icon name="check" size={16} strokeWidth={2.6} />
      </span>
    </span>
  );
});

export interface CheckboxListItemProps extends CheckboxProps {
  title: string;
  description?: string;
}

/** Linha de lista com checkbox (tela Exportar → "Incluir"). Use dentro de <List>. */
export function CheckboxListItem({ title, description, ...checkboxProps }: CheckboxListItemProps) {
  return (
    <li className={styles.listItem}>
      <label className={styles.row}>
        <Checkbox {...checkboxProps} />
        <span className={styles.text}>
          <span className={styles.title}>{title}</span>
          {description && <span className={styles.description}>{description}</span>}
        </span>
      </label>
    </li>
  );
}
