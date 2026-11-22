import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { fetchQuery, getQueryState, isStale, subscribe } from './queryCache';

export interface QueryResult<T> {
  data: T | undefined;
  error: unknown;
  /** Primeira carga, ainda sem dado: mostre <LoadingState>. */
  loading: boolean;
  /** Buscando de novo com dado antigo na tela. */
  refreshing: boolean;
  reload: () => Promise<void>;
}

/** Lê uma chave do cache, buscando na API se ainda não tiver ou estiver desatualizada. */
export function useQuery<T>(key: string, fetcher: () => Promise<T>): QueryResult<T> {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const state = useSyncExternalStore(
    useCallback((listener) => subscribe(key, listener), [key]),
    () => getQueryState<T>(key),
  );

  useEffect(() => {
    if (isStale(key)) fetchQuery(key, () => fetcherRef.current()).catch(() => {});
  }, [key]);

  const reload = useCallback(async () => {
    await fetchQuery(key, () => fetcherRef.current()).catch(() => {});
  }, [key]);

  return {
    data: state.data,
    error: state.error,
    loading: state.fetching && state.data === undefined,
    refreshing: state.fetching && state.data !== undefined,
    reload,
  };
}

/** Junta o estado de várias leituras de uma tela. */
export function combineQueries(...queries: Array<QueryResult<unknown>>) {
  return {
    loading: queries.some((q) => q.loading),
    refreshing: queries.some((q) => q.refreshing),
    error: queries.find((q) => q.error !== undefined)?.error,
    reload: async () => {
      await Promise.all(queries.map((q) => q.reload()));
    },
  };
}
