import { useEffect, useMemo, useState } from 'react';
import type { Product, SaleWithDetails } from '../types/api';
import { multiplyMoney, sumMoney } from '../lib/money';
import { MAX_INSTALLMENTS, previewInstallments, type InstallmentPreview } from '../lib/sale';
import { saleService } from '../services/saleService';
import { queryKeys } from './core/keys';
import { combineQueries } from './core/useQuery';
import { useMutation } from './core/useMutation';
import { queryErrorMessage } from './core/errors';
import { useToday } from './core/useToday';
import { useClientsData, useProductsData } from './data';
import { filterProducts } from './useProducts';
import { validateSaleDraft, type FieldErrors, type SaleDraftField } from './model/validation';
import { matchesSearch } from './model/text';

export interface DraftLine {
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

// ---------------------------------------------------------------- Rascunho
// O rascunho fica no sessionStorage para sobreviver à ida até "Novo cliente" / "Novo produto"
// no meio da venda. Some ao salvar, ao descartar ou ao fechar o app.

interface DraftSnapshot {
  clientId: number | null;
  quantities: Array<{ productId: number; quantity: number }>;
  installmentCount: number;
}

const DRAFT_KEY = 'app-vendas:nova-venda';
const EMPTY_DRAFT: DraftSnapshot = { clientId: null, quantities: [], installmentCount: 1 };

function readDraft(): DraftSnapshot {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY_DRAFT, ...(JSON.parse(raw) as DraftSnapshot) } : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

function writeDraft(draft: DraftSnapshot) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Sem armazenamento (modo privado etc.): o rascunho só não sobrevive à navegação.
  }
}

export function clearNewSaleDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignora
  }
}

/** Usado por "Novo cliente" aberto a partir da venda: já deixa o cliente escolhido. */
export function setNewSaleDraftClient(clientId: number) {
  writeDraft({ ...readDraft(), clientId });
}

/** Usado por "Novo produto" aberto a partir da venda: já adiciona o produto. */
export function addProductToNewSaleDraft(productId: number) {
  const draft = readDraft();
  if (!draft.quantities.some((q) => q.productId === productId)) {
    writeDraft({ ...draft, quantities: [...draft.quantities, { productId, quantity: 1 }] });
  }
}

export interface NewSaleOptions {
  /** Começa uma venda nova (ignora o rascunho guardado). */
  fresh?: boolean;
  /** Começa uma venda nova já com este cliente ("Nova venda para Carla"). */
  startWithClientId?: number;
}

export interface ProductOption {
  product: Product;
  /** Já está na venda: mostra "Na venda" em vez de "Adicionar". */
  inSale: boolean;
  /** Produto sem preço não pode ser vendido (o backend recusa). */
  disabled: boolean;
}

/**
 * Tela Nova venda + BottomSheet "Adicionar item".
 * O total e as parcelas mostrados são calculados com as mesmas regras do backend
 * (lib/sale.ts), então batem com o que será gravado.
 */
export function useNewSale(options: NewSaleOptions = {}) {
  const today = useToday();
  const clients = useClientsData();
  const products = useProductsData();
  const status = combineQueries(clients, products);

  // Lido uma vez só, na montagem.
  const [initial] = useState<DraftSnapshot>(() => {
    if (options.startWithClientId !== undefined) return { ...EMPTY_DRAFT, clientId: options.startWithClientId };
    if (options.fresh) return EMPTY_DRAFT;
    return readDraft();
  });
  const [clientId, setClientId] = useState<number | null>(initial.clientId);
  const [quantities, setQuantities] = useState<Array<{ productId: number; quantity: number }>>(initial.quantities);
  const [installmentCount, setInstallmentCountState] = useState(initial.installmentCount);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!finished) writeDraft({ clientId, quantities, installmentCount });
  }, [clientId, quantities, installmentCount, finished]);
  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [errors, setErrors] = useState<FieldErrors<SaleDraftField>>({});

  const create = useMutation((input: Parameters<typeof saleService.create>[0]) => saleService.create(input), [queryKeys.sales]);

  const productsById = useMemo(() => new Map((products.data ?? []).map((p) => [p.id, p])), [products.data]);
  const client = clients.data?.find((c) => c.clientId === clientId) ?? null;

  const lines = useMemo<DraftLine[]>(
    () =>
      quantities.flatMap(({ productId, quantity }) => {
        const product = productsById.get(productId);
        if (!product || product.price == null) return [];
        return [{ productId, name: product.name, unitPrice: product.price, quantity, subtotal: multiplyMoney(product.price, quantity) }];
      }),
    [quantities, productsById],
  );

  const total = useMemo(() => sumMoney(lines.map((l) => l.subtotal)), [lines]);
  const units = lines.reduce((acc, l) => acc + l.quantity, 0);
  const installments = useMemo<InstallmentPreview[]>(
    () => (total > 0 ? previewInstallments(total, installmentCount, today) : []),
    [total, installmentCount, today],
  );

  const productOptions = useMemo<ProductOption[]>(() => {
    const inSale = new Set(quantities.map((q) => q.productId));
    return filterProducts(products.data ?? [], productSearch).map((product) => ({
      product,
      inSale: inSale.has(product.id),
      disabled: product.price == null,
    }));
  }, [products.data, productSearch, quantities]);

  const clientOptions = useMemo(
    () => (clients.data ?? []).filter((c) => matchesSearch(clientSearch, c.name, c.phone)),
    [clients.data, clientSearch],
  );

  function clearError(field: SaleDraftField) {
    setErrors((e) => ({ ...e, [field]: undefined }));
    create.reset();
  }

  function selectClient(id: number) {
    setClientId(id);
    clearError('client');
  }

  function addProduct(productId: number) {
    setQuantities((q) => (q.some((l) => l.productId === productId) ? q : [...q, { productId, quantity: 1 }]));
    clearError('items');
  }

  /** Quantidade 0 remove o item ("Para remover um item, diminua até zero."). */
  function setQuantity(productId: number, quantity: number) {
    setQuantities((q) =>
      quantity <= 0
        ? q.filter((l) => l.productId !== productId)
        : q.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    );
    create.reset();
  }

  function setInstallmentCount(count: number) {
    setInstallmentCountState(Math.min(MAX_INSTALLMENTS, Math.max(1, Math.round(count))));
    clearError('installments');
  }

  /** Valida e registra. Resolve com a venda criada (para navegar até ela) ou undefined. */
  async function submit(): Promise<SaleWithDetails | undefined> {
    const result = validateSaleDraft({ clientId, lines: quantities, installmentCount });
    if (!result.ok) {
      setErrors(result.errors);
      return undefined;
    }
    const outcome = await create.run(result.value);
    if (!outcome.ok) return undefined;
    setFinished(true);
    clearNewSaleDraft();
    return outcome.data;
  }

  /** Abandona a venda (botão fechar). */
  function discard() {
    setFinished(true);
    clearNewSaleDraft();
  }

  return {
    client,
    selectClient,
    clients: clients.data ?? [],
    /** Painel "Escolher cliente": busca por nome ou telefone. */
    clientSearch,
    setClientSearch,
    clientOptions,
    lines,
    addProduct,
    setQuantity,
    total,
    units,
    installmentCount,
    setInstallmentCount,
    maxInstallments: MAX_INSTALLMENTS,
    installments,
    productSearch,
    setProductSearch,
    productOptions,
    errors,
    canSubmit: clientId !== null && lines.length > 0,
    /** Tem algo que se perderia ao fechar (para pedir confirmação). */
    hasChanges: quantities.length > 0,
    submit,
    discard,
    submitting: create.loading,
    submitError: create.error,
    ...status,
    error: queryErrorMessage(status.error),
  };
}
