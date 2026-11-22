import { forwardRef, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { NavLinkComponent } from '../../components';

/**
 * Volta para a tela anterior; se a tela foi aberta direto (sem histórico), vai para `fallback`.
 * O botão voltar do Android usa o mesmo histórico (webView.goBack).
 */
export function useGoBack() {
  const navigate = useNavigate();
  return (fallback: string) => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
}

/** Adapta o <Link> do React Router ao contrato `href` da BottomNav. */
export const RouterNavLink: NavLinkComponent = forwardRef<
  HTMLAnchorElement,
  { href: string; className?: string; 'aria-current'?: 'page'; children: ReactNode }
>(function RouterNavLink({ href, ...rest }, ref) {
  return <Link ref={ref} to={href} {...rest} />;
}) as unknown as NavLinkComponent;

/** Converte o :id da URL; NaN vira null (rota inválida → "não encontrado"). */
export function parseId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
