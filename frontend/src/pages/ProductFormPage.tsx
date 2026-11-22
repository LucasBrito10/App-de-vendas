import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Button, ConfirmSheet, DangerZone, Page, TextField, TopBar } from '../components';
import { addProductToNewSaleDraft, useProductForm } from '../hooks';
import { parseId, useGoBack } from './shared/navigation';
import { paths } from './shared/paths';
import { ScreenState } from './shared/ScreenState';

/** Novo produto (/produtos/novo) e Editar produto (/produtos/:id). */
export function ProductFormPage() {
  const params = useParams();
  const productId = params.id === undefined ? undefined : parseId(params.id) ?? -1;
  const [searchParams] = useSearchParams();
  const fromSale = searchParams.get('retorno') === 'venda';
  const navigate = useNavigate();
  const goBack = useGoBack();
  const f = useProductForm(productId);
  const [confirming, setConfirming] = useState(false);
  const formId = 'product-form';

  async function handleSubmit() {
    const saved = await f.submit();
    if (!saved) return;
    if (fromSale) {
      addProductToNewSaleDraft(saved.id);
      goBack(paths.newSale());
    } else {
      goBack(paths.products);
    }
  }

  async function handleDelete() {
    if (await f.deleteProduct()) navigate(paths.products, { replace: true });
  }

  return (
    <Page>
      <TopBar
        navigation="close"
        title={f.isEdit ? 'Editar produto' : 'Novo produto'}
        onNavigate={() => goBack(fromSale ? paths.newSale() : paths.products)}
        action={
          !f.notFound && (
            <Button type="submit" form={formId} size="sm" loading={f.saving}>
              Salvar
            </Button>
          )
        }
      />
      <ScreenState loading={f.loading} error={f.loadError} hasData={!f.isEdit || f.form.name !== ''} notFound={f.notFound} notFoundTitle="Produto não encontrado">
        <form
          id={formId}
          noValidate
          style={{ display: 'contents' }}
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <TextField
            label="Nome"
            placeholder="Ex.: Camiseta básica"
            value={f.form.name}
            onChange={(e) => f.setField('name', e.target.value)}
            error={f.errors.name}
            autoFocus={!f.isEdit}
          />
          <TextField
            label="Preço (R$)"
            placeholder="0,00"
            inputMode="decimal"
            emphasized
            value={f.form.price}
            onChange={(e) => f.setField('price', e.target.value)}
            error={f.errors.price}
            hint={f.isEdit ? 'Mudar o preço não altera as vendas já registradas.' : undefined}
          />
          {f.saveError && <Alert>{f.saveError}</Alert>}
        </form>
        {f.isEdit && (
          <>
            <DangerZone
              pushToBottom
              actionLabel="Excluir produto"
              onAction={() => setConfirming(true)}
              description="Vendas que já têm este produto continuam com o nome e o preço registrados."
            />
            <ConfirmSheet
              open={confirming}
              title={`Excluir ${f.form.name || 'produto'}?`}
              description="Ele sai do catálogo. As vendas já registradas não mudam."
              confirmLabel="Excluir produto"
              loading={f.deleting}
              error={f.deleteError}
              onConfirm={() => void handleDelete()}
              onCancel={() => {
                setConfirming(false);
                f.resetDeleteError();
              }}
            />
          </>
        )}
      </ScreenState>
    </Page>
  );
}
