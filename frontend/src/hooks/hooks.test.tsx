import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installFakeApi } from '../test/fakeApi';
import { clearQueryCache } from './core/queryCache';
import { addProductToNewSaleDraft, setNewSaleDraftClient, useClientForm, useClients, useDashboard, useExport, useNewSale, useOverdue, usePayment, useSaleDetail } from '.';

beforeEach(() => {
  clearQueryCache();
  sessionStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 14, 10, 0));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('camada hooks', () => {
  it('useDashboard carrega e monta o resumo do Início', async () => {
    installFakeApi();
    const { result } = renderHook(() => useDashboard());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.summary).toBeDefined());
    expect(result.current.summary!.overdueTotal).toBe(196.1);
    expect(result.current.error).toBeUndefined();
  });

  it('telas diferentes compartilham o cache (uma requisição por lista)', async () => {
    const { calls } = installFakeApi();
    const a = renderHook(() => useDashboard());
    const b = renderHook(() => useClients());
    await waitFor(() => expect(a.result.current.summary).toBeDefined());
    await waitFor(() => expect(b.result.current.items).toHaveLength(3));
    expect(calls.filter((c) => c.path === '/sales')).toHaveLength(1);
    expect(calls.filter((c) => c.path === '/clients')).toHaveLength(1);
  });

  it('usePayment registra o pagamento e as telas abertas se atualizam', async () => {
    const { calls } = installFakeApi();
    const overdue = renderHook(() => useOverdue());
    const payment = renderHook(() => usePayment());
    await waitFor(() => expect(overdue.result.current.summary?.installmentsCount).toBe(2));

    act(() => payment.result.current.open(overdue.result.current.summary!.items[0].installment));
    expect(payment.result.current.form).toEqual({ amount: '106,20', paidAt: '2026-11-14' });

    let ok = false;
    await act(async () => {
      ok = await payment.result.current.submit();
    });
    expect(ok).toBe(true);
    expect(payment.result.current.isOpen).toBe(false);
    expect(calls.find((c) => c.method === 'POST')).toMatchObject({
      path: '/sales/installments/122/payment',
      body: { paidAt: '2026-11-14', paidAmount: '106.20' },
    });
    await waitFor(() => expect(overdue.result.current.summary?.installmentsCount).toBe(1));
  });

  it('usePayment mostra o erro 409 do backend e mantém o painel aberto', async () => {
    const { db } = installFakeApi();
    const { result } = renderHook(() => usePayment());
    const paid = db.sales[2].installments[0]; // já paga
    act(() => result.current.open(paid));
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.error).toBe('Esta parcela já está paga.');
    expect(result.current.isOpen).toBe(true);
  });

  it('usePayment valida antes de enviar', async () => {
    const { calls } = installFakeApi();
    const { result } = renderHook(() => usePayment());
    act(() => result.current.open({ installmentId: 1, saleId: 1, number: 1, dueDate: '2026-11-01', amount: 10, paidAt: null, paidAmount: null }));
    act(() => result.current.setField('paidAt', '2026-12-01'));
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.errors.paidAt).toBe('Não pode ser uma data futura.');
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0);
  });

  it('useNewSale calcula como o backend e envia só itens com quantidade', async () => {
    const { calls } = installFakeApi();
    const { result } = renderHook(() => useNewSale({ startWithClientId: 2 }));
    await waitFor(() => expect(result.current.productOptions.length).toBe(4));
    act(() => {
      result.current.addProduct(10);
      result.current.addProduct(11);
      result.current.addProduct(12);
    });
    act(() => {
      result.current.setQuantity(10, 2);
      result.current.setQuantity(12, 3);
      result.current.setInstallmentCount(3);
    });
    expect(result.current.total).toBe(203.2);
    expect(result.current.units).toBe(6);
    expect(result.current.installments.map((i) => i.amount)).toEqual([67.74, 67.73, 67.73]);
    expect(result.current.productOptions.find((o) => o.product.id === 13)?.disabled).toBe(true);

    act(() => result.current.setQuantity(11, 0)); // remove o boné
    expect(result.current.lines.map((l) => l.productId)).toEqual([10, 12]);

    await act(async () => {
      await result.current.submit();
    });
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
      clientId: 2,
      installmentCount: 3,
      items: [{ productId: 10, quantity: 2 }, { productId: 12, quantity: 3 }],
    });
  });

  it('useNewSale guarda o rascunho e recebe cliente/produto cadastrados no meio da venda', async () => {
    installFakeApi();
    const first = renderHook(() => useNewSale({ startWithClientId: 2 }));
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    act(() => first.result.current.addProduct(10));
    first.unmount();

    setNewSaleDraftClient(1);
    addProductToNewSaleDraft(11);

    const back = renderHook(() => useNewSale());
    await waitFor(() => expect(back.result.current.lines).toHaveLength(2));
    expect(back.result.current.client?.name).toBe('Bruno Lima');

    act(() => back.result.current.discard());
    back.unmount();
    const again = renderHook(() => useNewSale());
    expect(again.result.current.hasChanges).toBe(false);
  });

  it('useNewSale não envia sem cliente', async () => {
    const { calls } = installFakeApi();
    const { result } = renderHook(() => useNewSale({ fresh: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.submit();
    });
    expect(result.current.errors).toMatchObject({ client: 'Escolha o cliente.', items: 'Adicione pelo menos um item.' });
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('useClientForm exclui o cliente e as vendas somem das outras telas', async () => {
    installFakeApi();
    const sale = renderHook(() => useSaleDetail(12));
    const form = renderHook(() => useClientForm(1));
    await waitFor(() => expect(form.result.current.form.name).toBe('Bruno Lima'));
    expect(form.result.current.form.phone).toBe('(75) 98820-5531');
    expect(form.result.current.salesCount).toBe(1);

    let ok = false;
    await act(async () => {
      ok = await form.result.current.deleteClient();
    });
    expect(ok).toBe(true);
    await waitFor(() => expect(sale.result.current.notFound).toBe(true));
  });

  it('useExport monta as URLs do período e baixa por navegação', async () => {
    const clicks: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push(this.getAttribute('href')!);
    });
    const { result } = renderHook(() => useExport());
    expect(result.current.period).toEqual({ startDate: '2026-11-01', endDate: '2026-11-14' });
    expect(result.current.urls).toEqual([
      '/api/v1/export/sales?startDate=2026-11-01&endDate=2026-11-14',
      '/api/v1/export/sale-items?startDate=2026-11-01&endDate=2026-11-14',
      '/api/v1/export/installments?startDate=2026-11-01&endDate=2026-11-14',
    ]);

    act(() => result.current.setPreset('last-month'));
    act(() => result.current.toggle('installments', false));
    expect(result.current.urls).toEqual([
      '/api/v1/export/sales?startDate=2026-10-01&endDate=2026-10-31',
      '/api/v1/export/sale-items?startDate=2026-10-01&endDate=2026-10-31',
    ]);

    await act(async () => {
      await result.current.download();
    });
    expect(clicks).toEqual(result.current.urls);

    act(() => result.current.setPreset('custom'));
    act(() => {
      result.current.setCustomStart('2026-11-10');
      result.current.setCustomEnd('2026-11-01');
    });
    expect(result.current.periodError).toBe('A data final não pode ser antes da inicial.');
    expect(result.current.canExport).toBe(false);
  });
});
