import { useRef, type KeyboardEvent } from 'react';
import { cx } from '../../lib/cx';
import styles from './ChipGroup.module.css';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

export interface ChipGroupProps<T extends string> {
  /** Nome do grupo para leitores de tela ("Filtrar vendas", "Período"). */
  label: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** "wrap" quebra linha (filtros de vendas); "fill" divide a largura igualmente (período). */
  layout?: 'wrap' | 'fill';
}

/** Seleção única em formato de pílulas (Todas / Em aberto / Atrasadas / Pagas). */
export function ChipGroup<T extends string>({ label, options, value, onChange, layout = 'wrap' }: ChipGroupProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  // Setas movem a seleção, como em um grupo de rádio nativo.
  function handleKeyDown(event: KeyboardEvent, index: number) {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={label} className={cx(styles.group, styles[layout])}>
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={cx(styles.chip, selected && styles.selected)}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
