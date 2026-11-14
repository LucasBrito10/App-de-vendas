import { useId, type ReactNode } from 'react';
import styles from './PickerField.module.css';

export interface PickerFieldProps {
  label: ReactNode;
  /** Valor escolhido; sem valor mostra o placeholder. */
  value?: ReactNode;
  placeholder?: ReactNode;
  /** Texto da ação à direita. Padrão: "Trocar" com valor, "Escolher" sem. */
  actionLabel?: string;
  onPick: () => void;
  error?: ReactNode;
}

/** Campo que abre um seletor (ex.: Cliente da nova venda → "Carla Menezes  Trocar"). */
export function PickerField({ label, value, placeholder = 'Escolher', actionLabel, onPick, error }: PickerFieldProps) {
  const labelId = useId();
  const action = actionLabel ?? (value ? 'Trocar' : 'Escolher');
  return (
    <div className={styles.field}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <button
        type="button"
        className={styles.box}
        onClick={onPick}
        aria-labelledby={labelId}
        aria-describedby={error ? `${labelId}-error` : undefined}
      >
        <span className={value ? styles.value : styles.placeholder}>{value ?? placeholder}</span>
        <span className={styles.action}>{action}</span>
      </button>
      {error && (
        <p id={`${labelId}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
