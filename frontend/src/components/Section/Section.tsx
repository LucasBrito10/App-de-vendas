import { useId, type ReactNode } from 'react';
import styles from './Section.module.css';

export interface SectionProps {
  title?: ReactNode;
  /** Conteúdo à direita do título: link ("Ver todas") ou texto ("0 de 3 pagas"). */
  aside?: ReactNode;
  /** Texto auxiliar abaixo do conteúdo ("Para remover um item, diminua até zero."). */
  footnote?: ReactNode;
  children: ReactNode;
}

/** Bloco com título de seção ("Últimas vendas", "Parcelas", "Itens"...). */
export function Section({ title, aside, footnote, children }: SectionProps) {
  const titleId = useId();
  return (
    <section className={styles.section} aria-labelledby={title ? titleId : undefined}>
      {(title || aside) && (
        <div className={styles.header}>
          {title && (
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          )}
          {aside && <div className={styles.aside}>{aside}</div>}
        </div>
      )}
      {children}
      {footnote && <p className={styles.footnote}>{footnote}</p>}
    </section>
  );
}
