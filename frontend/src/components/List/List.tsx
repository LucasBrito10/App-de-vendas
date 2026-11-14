import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './List.module.css';

export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  children: ReactNode;
}

/** Cartão com linhas separadas por divisórias. Use com <ListItem>. */
export function List({ className, ...rest }: ListProps) {
  return <ul className={cx(styles.list, className)} {...rest} />;
}

export interface ListItemProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Conteúdo à esquerda do título (ex.: checkbox na tela Exportar). */
  leading?: ReactNode;
  /** Valor principal à direita ("R$ 342,50"). */
  value?: ReactNode;
  /** Linha abaixo do valor, normalmente um <StatusText>. */
  valueCaption?: ReactNode;
  /** Controle à direita no lugar do valor (botão "Receber", Stepper...). */
  action?: ReactNode;
  /** Torna a linha inteira clicável (abre detalhe). Não use junto com `action`. */
  onClick?: () => void;
  /** Valor em cinza (lista de produtos). */
  mutedValue?: boolean;
  /** Linha mais baixa, só com o título (lista de produtos). */
  compact?: boolean;
}

/** Linha de lista: título/subtítulo à esquerda, valor/estado ou ação à direita. */
export function ListItem({
  title,
  subtitle,
  leading,
  value,
  valueCaption,
  action,
  onClick,
  mutedValue,
  compact,
}: ListItemProps) {
  const content = (
    <>
      {leading && <div className={styles.leading}>{leading}</div>}
      <div className={styles.main}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      {(value || valueCaption) && (
        <div className={styles.trailing}>
          {value && <span className={cx(styles.value, mutedValue && styles.mutedValue)}>{value}</span>}
          {valueCaption && <span className={styles.caption}>{valueCaption}</span>}
        </div>
      )}
      {action && <div className={styles.action}>{action}</div>}
    </>
  );

  const rowClass = cx(styles.row, compact && styles.compact);

  return (
    <li className={styles.item}>
      {onClick ? (
        <button type="button" className={cx(rowClass, styles.clickable)} onClick={onClick}>
          {content}
        </button>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
    </li>
  );
}
