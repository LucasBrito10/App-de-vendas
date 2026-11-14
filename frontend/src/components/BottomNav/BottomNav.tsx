import type { ComponentType, ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { Icon, type IconName } from '../Icon';
import styles from './BottomNav.module.css';

export interface BottomNavItem {
  key: string;
  label: string;
  icon: IconName;
  href: string;
}

/** Componente de link compatível com <a> e com o <Link to> do React Router. */
export type NavLinkComponent = ComponentType<{
  href: string;
  className?: string;
  'aria-current'?: 'page';
  children: ReactNode;
}>;

export interface BottomNavProps {
  items?: BottomNavItem[];
  activeKey: string;
  /**
   * Por padrão renderiza <a href>. Para usar com React Router:
   * linkComponent={({ href, ...p }) => <Link to={href} {...p} />}
   */
  linkComponent?: NavLinkComponent;
}

export const DEFAULT_NAV_ITEMS: BottomNavItem[] = [
  { key: 'inicio', label: 'Início', icon: 'home', href: '/' },
  { key: 'clientes', label: 'Clientes', icon: 'users', href: '/clientes' },
  { key: 'vendas', label: 'Vendas', icon: 'receipt', href: '/vendas' },
  { key: 'produtos', label: 'Produtos', icon: 'tag', href: '/produtos' },
  { key: 'exportar', label: 'Exportar', icon: 'download', href: '/exportar' },
];

const DefaultLink: NavLinkComponent = (props) => <a {...props} />;

/** Navegação fixa no rodapé das 5 telas principais. */
export function BottomNav({ items = DEFAULT_NAV_ITEMS, activeKey, linkComponent: Link = DefaultLink }: BottomNavProps) {
  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      <ul className={styles.list}>
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <li key={item.key} className={styles.item}>
              <Link
                href={item.href}
                className={cx(styles.link, active && styles.active)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon name={item.icon} size={22} />
                <span className={styles.label}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
