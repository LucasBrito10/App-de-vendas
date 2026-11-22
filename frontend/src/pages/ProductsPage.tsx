import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, HelperText, List, ListItem, Page, PageHeader, SearchField } from '../components';
import { useProducts } from '../hooks';
import { formatCurrency } from '../lib/format';
import { MainNav } from './shared/MainNav';
import { paths } from './shared/paths';
import { ScreenState } from './shared/ScreenState';

export function ProductsPage() {
  const navigate = useNavigate();
  const { items, search, setSearch, totalCount, isEmpty, loading, error, reload } = useProducts();
  const newProduct = () => navigate(paths.newProduct());

  return (
    <>
      <Page withBottomNav>
        <PageHeader title="Produtos" action={<Button variant="link" onClick={newProduct}>Novo produto</Button>} />
        {!isEmpty && <SearchField placeholder="Buscar pelo nome" value={search} onChange={(e) => setSearch(e.target.value)} />}
        <ScreenState loading={loading} error={error} hasData={totalCount > 0 || isEmpty} onRetry={reload} rows={6}>
          {isEmpty ? (
            <EmptyState title="Nenhum produto cadastrado" action={<Button onClick={newProduct}>Cadastrar produto</Button>} />
          ) : items.length === 0 ? (
            <EmptyState title="Nenhum produto encontrado" />
          ) : (
            <>
              <List>
                {items.map((p) => (
                  <ListItem
                    key={p.id}
                    compact
                    title={p.name}
                    value={p.price == null ? 'Sem preço' : formatCurrency(p.price)}
                    mutedValue
                    onClick={() => navigate(paths.editProduct(p.id))}
                  />
                ))}
              </List>
              <HelperText>
                {search ? `${items.length} de ${totalCount}` : totalCount} {totalCount === 1 ? 'produto' : 'produtos'}
              </HelperText>
            </>
          )}
        </ScreenState>
      </Page>
      <MainNav />
    </>
  );
}
