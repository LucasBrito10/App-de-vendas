import { useLocation } from 'react-router-dom';
import { BottomNav } from '../../components';
import { RouterNavLink } from './navigation';

const SECTIONS: Array<[prefix: string, key: string]> = [
  ['/clientes', 'clientes'],
  ['/vendas', 'vendas'],
  ['/produtos', 'produtos'],
  ['/exportar', 'exportar'],
];

/** BottomNav ligada ao roteador: marca a seção pela URL atual. */
export function MainNav() {
  const { pathname } = useLocation();
  const activeKey = SECTIONS.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? 'inicio';
  return <BottomNav activeKey={activeKey} linkComponent={RouterNavLink} />;
}
