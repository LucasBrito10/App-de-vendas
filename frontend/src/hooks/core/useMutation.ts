import { useCallback, useEffect, useRef, useState } from 'react';
import { invalidate } from './queryCache';
import { errorMessage } from './errors';

/** Resultado de uma escrita. Nunca rejeita: a falha vem como { ok: false }. */
export type MutationOutcome<R> = { ok: true; data: R } | { ok: false; error: string };

export interface MutationResult<A extends unknown[], R> {
  /** Executa. Também guarda a mensagem de erro em `error` para mostrar em <Alert>. */
  run: (...args: A) => Promise<MutationOutcome<R>>;
  /** Para Button loading / BottomSheet busy. */
  loading: boolean;
  /** Mensagem pronta para <Alert>. */
  error: string | null;
  reset: () => void;
}

/**
 * Escrita na API (POST/DELETE). Ao terminar bem, invalida as chaves do cache informadas,
 * para todas as telas abertas atualizarem sozinhas.
 */
export function useMutation<A extends unknown[], R>(
  mutate: (...args: A) => Promise<R>,
  invalidates: string[] = [],
): MutationResult<A, R> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const busy = useRef(false);
  const mutateRef = useRef(mutate);
  mutateRef.current = mutate;
  const invalidatesKey = invalidates.join('|');

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args: A): Promise<MutationOutcome<R>> => {
      // Evita envio duplo por toque repetido (ex.: duas vendas iguais).
      if (busy.current) return { ok: false, error: 'Aguarde, ainda processando.' };
      busy.current = true;
      setLoading(true);
      setError(null);
      try {
        const result = await mutateRef.current(...args);
        if (invalidatesKey) invalidate(...invalidatesKey.split('|'));
        return { ok: true, data: result };
      } catch (e) {
        const message = errorMessage(e);
        if (mounted.current) setError(message);
        return { ok: false, error: message };
      } finally {
        busy.current = false;
        if (mounted.current) setLoading(false);
      }
    },
    [invalidatesKey],
  );

  const reset = useCallback(() => setError(null), []);

  return { run, loading, error, reset };
}
