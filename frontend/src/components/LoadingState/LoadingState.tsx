import styles from './LoadingState.module.css';

export interface LoadingStateProps {
  /** Quantas linhas "fantasma" mostrar no lugar da lista. */
  rows?: number;
  /** Texto para leitores de tela. */
  label?: string;
}

/** Esqueleto de lista enquanto a requisição não volta. */
export function LoadingState({ rows = 3, label = 'Carregando…' }: LoadingStateProps) {
  return (
    <div className={styles.list} role="status" aria-live="polite">
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.row} aria-hidden>
          <div className={styles.lines}>
            <span className={styles.lineLong} />
            <span className={styles.lineShort} />
          </div>
          <span className={styles.value} />
        </div>
      ))}
    </div>
  );
}
