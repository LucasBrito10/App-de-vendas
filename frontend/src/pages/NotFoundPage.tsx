import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, Page, TopBar } from '../components';
import { paths } from './shared/paths';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Page>
      <TopBar />
      <EmptyState
        title="Página não encontrada"
        action={<Button onClick={() => navigate(paths.home, { replace: true })}>Ir para o início</Button>}
      />
    </Page>
  );
}
