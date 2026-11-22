import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, buildUrl, http } from './http';

const respond = (status: number, body?: unknown) =>
  vi.stubGlobal('fetch', vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status })));

afterEach(() => vi.unstubAllGlobals());

describe('camada service: http', () => {
  it('monta a URL com /api/v1 e ignora parâmetros vazios', () => {
    expect(buildUrl('/sales', { clientId: 3, startDate: undefined, endDate: '', withSales: true })).toBe(
      '/api/v1/sales?clientId=3&withSales=true',
    );
  });

  it('todo POST leva Content-Type JSON e corpo (o NanoServer recusa sem)', async () => {
    respond(200, {});
    await http.post('/sales/installments/1/payment');
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init!.headers as Record<string, string>)['Content-Type']).toMatch(/^application\/json/);
    expect(init!.body).toBe('{}');
    expect(init!.credentials).toBe('same-origin');
  });

  it('DELETE com 204 resolve sem tentar ler JSON', async () => {
    respond(204);
    await expect(http.delete('/clients/1')).resolves.toBeUndefined();
  });

  it('transforma { error } do backend em ApiError com status', async () => {
    respond(409, { error: 'Esta parcela já está paga.' });
    const error = (await http.post('/x').catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.isConflict).toBe(true);
    expect(error.message).toBe('Esta parcela já está paga.');
  });

  it('usa mensagem padrão quando o erro não tem corpo', async () => {
    respond(401);
    await expect(http.get('/clients')).rejects.toThrow('Sessão expirada');
  });

  it('falha de rede vira ApiError status 0', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const error = (await http.get('/clients').catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.isNetworkError).toBe(true);
  });
});
