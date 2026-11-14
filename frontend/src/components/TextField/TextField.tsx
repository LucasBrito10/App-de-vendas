import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './TextField.module.css';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: ReactNode;
  /** Texto de ajuda abaixo do campo ("Não pode ser uma data futura."). */
  hint?: ReactNode;
  /** Mensagem de erro; substitui o hint e marca o campo como inválido. */
  error?: ReactNode;
  /** Deixa o valor em negrito (campos de valor em R$). */
  emphasized?: boolean;
}

/** Campo de formulário com rótulo, ajuda e erro. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, emphasized, id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = `${inputId}-help`;
  const help = error ?? hint;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={cx(styles.input, emphasized && styles.emphasized, error && styles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={help ? helpId : undefined}
        {...rest}
      />
      {help && (
        <p id={helpId} className={cx(styles.help, error && styles.error)} role={error ? 'alert' : undefined}>
          {help}
        </p>
      )}
    </div>
  );
});
