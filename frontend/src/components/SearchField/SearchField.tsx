import { forwardRef, type InputHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import styles from './SearchField.module.css';

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Rótulo para leitores de tela; por padrão usa o placeholder. */
  label?: string;
}

/** Caixa de busca das listas ("Buscar por nome ou telefone", "Buscar produto"). */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { label, placeholder = 'Buscar', className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="search"
      enterKeyHint="search"
      autoComplete="off"
      placeholder={placeholder}
      aria-label={label ?? placeholder}
      className={cx(styles.search, className)}
      {...rest}
    />
  );
});
