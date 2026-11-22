import type { ReactNode } from 'react';
import { Alert, Button, EmptyState, LoadingState } from '../../components';

export interface ScreenStateProps {
  loading: boolean;
  error?: string;
  /** Há dado para mostrar (mesmo que antigo). */
  hasData: boolean;
  notFound?: boolean;
  notFoundTitle?: string;
  onRetry?: () => void;
  rows?: number;
  children: ReactNode;
}

/**
 * Decide entre carregando / erro / não encontrado / conteúdo.
 * Com dado antigo na tela e erro ao recarregar, mostra o aviso em cima do conteúdo.
 */
export function ScreenState({ loading, error, hasData, notFound, notFoundTitle, onRetry, rows, children }: ScreenStateProps) {
  const retry = onRetry && (
    <Button variant="link" size="sm" onClick={onRetry}>
      Tentar de novo
    </Button>
  );

  if (notFound) {
    return <EmptyState title={notFoundTitle ?? 'Registro não encontrado'} description="Ele pode ter sido excluído." />;
  }
  if (!hasData) {
    if (error) return <Alert action={retry}>{error}</Alert>;
    if (loading) return <LoadingState rows={rows} />;
  }
  return (
    <>
      {error && <Alert action={retry}>{error}</Alert>}
      {children}
    </>
  );
}
