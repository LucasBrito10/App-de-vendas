import { IconButton } from '../IconButton';
import styles from './Stepper.module.css';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Descreve o que está sendo contado, para leitores de tela ("Quantidade de Camiseta básica"). */
  label: string;
}

/** Controle "−  2  +" de quantidade de itens e número de parcelas. */
export function Stepper({ value, onChange, min = 0, max = Number.MAX_SAFE_INTEGER, label }: StepperProps) {
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <IconButton
        icon="minus"
        label="Diminuir"
        variant="outlined"
        size={20}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      />
      <output className={styles.value} aria-live="polite">
        {value}
      </output>
      <IconButton
        icon="plus"
        label="Aumentar"
        variant="outlined"
        size={20}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      />
    </div>
  );
}
