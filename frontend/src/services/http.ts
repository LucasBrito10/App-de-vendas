// Cliente HTTP da API local (NanoServer em 127.0.0.1:8080, mesma origem do frontend).
// Única parte do frontend que conhece fetch, cabeçalhos e o formato de erro do backend.

const BASE_PATH = '/api/v1';
const TIMEOUT_MS = 15_000;

/** Erro vindo da API (status HTTP + mensagem { error } do backend) ou de rede (status 0). */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }

  /** O servidor do app não respondeu (parado, demorou demais...). */
  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /** 404: o registro foi apagado ou nunca existiu. */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** 409: regra violada pelo estado atual (ex.: "Esta parcela já está paga."). */
  get isConflict(): boolean {
    return this.status === 409;
  }
}

export type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue>;

/** Monta "/api/v1/sales?clientId=3&startDate=..." ignorando parâmetros vazios. */
export function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return `${BASE_PATH}${path}${qs ? `?${qs}` : ''}`;
}

const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'Dados inválidos.',
  401: 'Sessão expirada. Feche e abra o app de novo.',
  403: 'Acesso não permitido.',
  404: 'Registro não encontrado.',
  405: 'Operação não permitida.',
  409: 'A operação não pode ser feita no estado atual.',
  415: 'Formato da requisição inválido.',
};

export interface RequestOptions {
  query?: Query;
  /** Corpo JSON (só POST). */
  body?: unknown;
  /** Para cancelar quando a tela é fechada antes da resposta. */
  signal?: AbortSignal;
}

type Method = 'GET' | 'POST' | 'DELETE';

export async function request<T>(method: Method, path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, signal } = options;

  // Junta o cancelamento externo com o tempo limite (AbortSignal.any não existe em WebViews antigas).
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', onExternalAbort);

  const headers: Record<string, string> = { Accept: 'application/json' };
  let payload: string | undefined;
  if (method === 'POST') {
    // O NanoServer exige Content-Type application/json em todo POST, mesmo com corpo opcional.
    headers['Content-Type'] = 'application/json; charset=UTF-8';
    payload = JSON.stringify(body ?? {});
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: payload,
      // O token de sessão vai no cookie HttpOnly gravado pela MainActivity.
      credentials: 'same-origin',
      signal: controller.signal,
    });
  } catch (error) {
    if (signal?.aborted && !timedOut) throw error; // cancelado por quem chamou: só repassa
    throw new ApiError(
      0,
      timedOut
        ? 'O app demorou para responder. Tente de novo.'
        : 'Não foi possível falar com o app. Feche e abra de novo.',
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }

  // DELETE responde 204 sem corpo.
  const text = response.status === 204 ? '' : await response.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined;
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : FALLBACK_MESSAGES[response.status] ?? 'Erro inesperado no app. Tente de novo.';
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export const http = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>('POST', path, { body, signal }),
  delete: <T = void>(path: string, signal?: AbortSignal) => request<T>('DELETE', path, { signal }),
};
