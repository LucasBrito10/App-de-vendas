import { useEffect, useMemo, useState } from 'react';
import type { Client } from '../types/api';
import { formatPhone } from '../lib/format';
import { clientService } from '../services/clientService';
import { queryKeys } from './core/keys';
import { useMutation } from './core/useMutation';
import { queryErrorMessage } from './core/errors';
import { useClientsData, useSalesData } from './data';
import { validateClientForm, type ClientForm, type FieldErrors } from './model/validation';

const EMPTY: ClientForm = { name: '', phone: '' };

/**
 * Telas Novo cliente / Editar cliente.
 * Sem clientId: cadastro. Com clientId: edição (carrega os dados e permite excluir).
 */
export function useClientForm(clientId?: number) {
  const isEdit = clientId !== undefined;
  const clients = useClientsData();
  const sales = useSalesData();
  const client = isEdit ? clients.data?.find((c) => c.clientId === clientId) : undefined;

  const [form, setForm] = useState<ClientForm>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<keyof ClientForm>>({});
  const [loadedId, setLoadedId] = useState<number | null>(null);

  // Preenche o formulário uma vez quando o cliente chega (sem sobrescrever o que já foi digitado).
  useEffect(() => {
    if (client && loadedId !== client.clientId) {
      setForm({ name: client.name, phone: formatPhone(client.phone) });
      setLoadedId(client.clientId);
    }
  }, [client, loadedId]);

  const save = useMutation(
    (input: { name: string; phone: string }) =>
      isEdit ? clientService.update(clientId, input) : clientService.create(input),
    [queryKeys.clients],
  );
  // Excluir cliente apaga também as vendas dele.
  const remove = useMutation(() => clientService.remove(clientId!), [queryKeys.clients, queryKeys.sales]);

  const salesCount = useMemo(
    () => (isEdit ? (sales.data ?? []).filter((s) => s.sale.clientId === clientId).length : 0),
    [isEdit, sales.data, clientId],
  );

  function setField<K extends keyof ClientForm>(field: K, value: ClientForm[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    save.reset();
  }

  /** Valida e salva. Resolve com o cliente salvo, ou undefined (erros ficam em errors/saveError). */
  async function submit(): Promise<Client | undefined> {
    const result = validateClientForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      return undefined;
    }
    const outcome = await save.run({ name: result.value.name!, phone: result.value.phone! });
    return outcome.ok ? outcome.data : undefined;
  }

  /** Exclui o cliente. Resolve true se excluiu. */
  async function deleteClient(): Promise<boolean> {
    if (!isEdit) return false;
    return (await remove.run()).ok;
  }

  return {
    isEdit,
    form,
    errors,
    setField,
    submit,
    saving: save.loading,
    saveError: save.error,
    deleteClient,
    deleting: remove.loading,
    deleteError: remove.error,
    resetDeleteError: remove.reset,
    /** Para o texto "Apaga também as N vendas e as parcelas deste cliente." */
    salesCount,
    loading: isEdit && clients.loading,
    notFound: isEdit && clients.data !== undefined && !client,
    loadError: queryErrorMessage(clients.error),
  };
}
