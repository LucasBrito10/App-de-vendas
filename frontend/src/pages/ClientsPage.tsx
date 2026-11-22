import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, List, ListItem, Page, PageHeader, SearchField, StatusText } from '../components';
import { useClients } from '../hooks';
import { formatPhone } from '../lib/format';
import { MainNav } from './shared/MainNav';
import { paths } from './shared/paths';
import { ScreenState } from './shared/ScreenState';

export function ClientsPage() {
  const navigate = useNavigate();
  const { items, search, setSearch, isEmpty, loading, error, reload, totalCount } = useClients();
  const newClient = () => navigate(paths.newClient());

  return (
    <>
      <Page withBottomNav>
        <PageHeader title="Clientes" action={<Button variant="link" onClick={newClient}>Novo cliente</Button>} />
        {!isEmpty && (
          <SearchField placeholder="Buscar por nome ou telefone" value={search} onChange={(e) => setSearch(e.target.value)} />
        )}
        <ScreenState loading={loading} error={error} hasData={totalCount > 0 || isEmpty} onRetry={reload} rows={6}>
          {isEmpty ? (
            <EmptyState
              title="Nenhum cliente cadastrado"
              action={<Button onClick={newClient}>Cadastrar cliente</Button>}
            />
          ) : items.length === 0 ? (
            <EmptyState title="Nenhum cliente encontrado" description="Confira o nome ou o telefone digitado." />
          ) : (
            <List>
              {items.map(({ client, hasOverdue }) => (
                <ListItem
                  key={client.clientId}
                  title={client.name}
                  subtitle={client.phone ? formatPhone(client.phone) : 'Sem telefone'}
                  valueCaption={hasOverdue && <StatusText status="overdue">Atrasado</StatusText>}
                  onClick={() => navigate(paths.client(client.clientId))}
                />
              ))}
            </List>
          )}
        </ScreenState>
      </Page>
      <MainNav />
    </>
  );
}
