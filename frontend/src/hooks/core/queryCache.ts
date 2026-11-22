// Cache compartilhado das leituras da API.
//
// Por que existe: várias telas usam os mesmos dados (Início, Clientes, Vendas e Atrasados leem
// todos a lista de vendas). O cache evita buscar de novo a cada navegação e garante que todas
// as telas mostrem a mesma informação.
//
// Quando fica desatualizado: só o próprio app grava no banco, então basta invalidar as chaves
// afetadas depois de cada escrita (ver invalidate em useMutation). Não há expiração por tempo.

export interface QueryState<T> {
  data: T | undefined;
  error: unknown;
  /** Buscando (primeira vez ou recarregando). */
  fetching: boolean;
}

interface Entry {
  state: QueryState<unknown>;
  promise: Promise<unknown> | null;
  fetcher: (() => Promise<unknown>) | null;
  stale: boolean;
  listeners: Set<() => void>;
}

const entries = new Map<string, Entry>();
const EMPTY: QueryState<never> = { data: undefined, error: undefined, fetching: false };

function getEntry(key: string): Entry {
  let entry = entries.get(key);
  if (!entry) {
    entry = { state: EMPTY, promise: null, fetcher: null, stale: true, listeners: new Set() };
    entries.set(key, entry);
  }
  return entry;
}

function setState(entry: Entry, patch: Partial<QueryState<unknown>>) {
  entry.state = { ...entry.state, ...patch };
  entry.listeners.forEach((listener) => listener());
}

export function getQueryState<T>(key: string): QueryState<T> {
  return (entries.get(key)?.state ?? EMPTY) as QueryState<T>;
}

export function subscribe(key: string, listener: () => void): () => void {
  const entry = getEntry(key);
  entry.listeners.add(listener);
  return () => entry.listeners.delete(listener);
}

/** Busca (ou reaproveita a busca em andamento) e guarda o resultado. */
export function fetchQuery<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const entry = getEntry(key);
  entry.fetcher = fetcher;
  if (entry.promise) return entry.promise as Promise<T>;

  setState(entry, { fetching: true });
  const promise = fetcher().then(
    (data) => {
      entry.stale = false;
      setState(entry, { data, error: undefined, fetching: false });
      return data;
    },
    (error: unknown) => {
      // Mantém o último dado bom na tela; o erro aparece em Alert.
      setState(entry, { error, fetching: false });
      throw error;
    },
  );
  entry.promise = promise;
  promise.finally(() => {
    if (entry.promise === promise) entry.promise = null;
  }).catch(() => {});
  return promise;
}

export function isStale(key: string): boolean {
  return entries.get(key)?.stale ?? true;
}

/** Grava um resultado já conhecido (ex.: resposta de um POST) sem ir ao servidor. */
export function setQueryData<T>(key: string, data: T) {
  const entry = getEntry(key);
  entry.stale = false;
  setState(entry, { data, error: undefined });
}

/**
 * Marca como desatualizadas as chaves que começam com algum prefixo.
 * As que estão na tela são buscadas de novo na hora; as outras, quando a tela abrir.
 */
export function invalidate(...prefixes: string[]) {
  for (const [key, entry] of entries) {
    if (!prefixes.some((p) => key === p || key.startsWith(`${p}:`))) continue;
    entry.stale = true;
    if (entry.listeners.size > 0 && entry.fetcher) {
      fetchQuery(key, entry.fetcher).catch(() => {});
    }
  }
}

/** Só para testes. */
export function clearQueryCache() {
  entries.clear();
}
