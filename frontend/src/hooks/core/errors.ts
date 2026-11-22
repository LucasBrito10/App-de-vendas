import { ApiError } from '../../services/http';

/** Texto para <Alert> a partir de qualquer erro (da API, de rede ou inesperado). */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Algo deu errado. Tente de novo.';
}

/** Mensagem para a tela, ou undefined se não houver erro. */
export function queryErrorMessage(error: unknown): string | undefined {
  return error === undefined ? undefined : errorMessage(error);
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.isNotFound;
}
