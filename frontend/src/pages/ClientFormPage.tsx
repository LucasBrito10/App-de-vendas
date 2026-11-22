import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Button, ConfirmSheet, DangerZone, Page, TextField, TopBar } from '../components';
import { setNewSaleDraftClient, useClientForm } from '../hooks';
import { parseId, useGoBack } from './shared/navigation';
import { paths } from './shared/paths';
import { ScreenState } from './shared/ScreenState';

/** Novo cliente (/clientes/novo) e Editar cliente (/clientes/:id/editar). */
export function ClientFormPage() {
  const params = useParams();
  const clientId = params.id === undefined ? undefined : parseId(params.id) ?? -1;
  const [searchParams] = useSearchParams();
  const fromSale = searchParams.get('retorno') === 'venda';
  const navigate = useNavigate();
  const goBack = useGoBack();
  const f = useClientForm(clientId);
  const [confirming, setConfirming] = useState(false);
  const formId = 'client-form';

  async function handleSubmit() {
    const saved = await f.submit();
    if (!saved) return;
    if (fromSale) {
      setNewSaleDraftClient(saved.clientId);
      goBack(paths.newSale());
    } else if (f.isEdit) {
      goBack(paths.client(saved.clientId));
    } else {
      navigate(paths.client(saved.clientId), { replace: true });
    }
  }

  async function handleDelete() {
    if (await f.deleteClient()) navigate(paths.clients, { replace: true });
  }

  const sales = f.salesCount;

  return (
    <Page>
      <TopBar
        navigation="close"
        title={f.isEdit ? 'Editar cliente' : 'Novo cliente'}
        onNavigate={() => goBack(clientId ? paths.client(clientId) : paths.clients)}
        action={
          !f.notFound && (
            <Button type="submit" form={formId} size="sm" loading={f.saving}>
              Salvar
            </Button>
          )
        }
      />
      <ScreenState loading={f.loading} error={f.loadError} hasData={!f.isEdit || f.form.name !== ''} notFound={f.notFound} notFoundTitle="Cliente não encontrado">
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
            autoComplete="name"
            autoCapitalize="words"
            value={f.form.name}
            onChange={(e) => f.setField('name', e.target.value)}
            error={f.errors.name}
            autoFocus={!f.isEdit}
          />
          <TextField
            label="Telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(75) 99999-9999"
            value={f.form.phone}
            onChange={(e) => f.setField('phone', e.target.value)}
            error={f.errors.phone}
          />
          {f.saveError && <Alert>{f.saveError}</Alert>}
        </form>
        {f.isEdit && (
          <>
            <DangerZone
              pushToBottom
              actionLabel="Excluir cliente"
              onAction={() => setConfirming(true)}
              description={
                sales > 0
                  ? `Apaga também ${sales === 1 ? 'a venda' : `as ${sales} vendas`} e as parcelas deste cliente.`
                  : 'Este cliente não tem vendas.'
              }
            />
            <ConfirmSheet
              open={confirming}
              title={`Excluir ${f.form.name || 'cliente'}?`}
              description={
                sales > 0
                  ? `${sales === 1 ? 'A venda' : `As ${sales} vendas`} e as parcelas também serão apagadas. Não dá para desfazer.`
                  : 'Não dá para desfazer.'
              }
              confirmLabel="Excluir cliente"
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
