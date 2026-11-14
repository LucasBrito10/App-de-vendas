import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  title: ReactNode;
  /** Texto pequeno acima do título ("Dados de exemplo"). */
  eyebrow?: ReactNode;
  /** Texto de apoio abaixo do título (tela Exportar). */
  description?: ReactNode;
  /** Ação à direita, normalmente um <Button variant="link"> ("Novo cliente"). */
  action?: ReactNode;
}

/** Cabeçalho grande das telas principais (as que aparecem na BottomNav). */
export function PageHeader({ title, eyebrow, description, action }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </header>
  );
}
