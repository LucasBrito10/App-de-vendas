import { describe, expect, it } from 'vitest';
import { seed } from '../../test/fakeApi';
import { buildClientDetail, buildClientList, buildDashboard, buildOverdue, buildSaleDetail, buildSaleSummaries, filterSalesByStatus } from './viewModels';
import { validateClientForm, validatePaymentForm, validateProductForm, validateSaleDraft } from './validation';
import { normalizePhone } from './phone';
import { phoneHref, whatsappHref } from './contact';
import { matchesSearch } from './text';

const TODAY = '2026-11-14';

describe('hooks/model: dados das telas', () => {
  const db = seed();

  it('Início: vendido no mês, clientes e atrasados', () => {
    const d = buildDashboard(db.sales, db.clients, TODAY);
    expect(d.monthTotal).toBe(342.5);
    expect(d.monthSalesCount).toBe(1);
    expect(d.clientsCount).toBe(3);
    expect(d.overdueClientsCount).toBe(2);
    expect(d.overdueTotal).toBe(196.1); // 106,20 + 89,90, como no layout
    expect(d.recentSales.map((s) => s.saleId)).toEqual([19, 15, 12]);
  });

  it('Atrasados: mais antigas primeiro, dias de atraso e link de cobrança', () => {
    const o = buildOverdue(db.sales, db.clients, TODAY);
    expect(o.items.map((i) => [i.clientName, i.daysLate, i.installmentCount])).toEqual([
      ['Bruno Lima', 12, 2],
      ['Fábio Costa', 5, 1],
    ]);
    expect(o.items[0].chargeHref).toMatch(/^https:\/\/wa\.me\/5575988205531\?text=Oi%2C%20Bruno/);
    expect(o.items[1].chargeHref).toBeNull(); // sem telefone
  });

  it('Vendas: situação de cada venda e filtro', () => {
    const all = buildSaleSummaries(db.sales, db.clients, TODAY);
    expect(all.map((s) => s.status)).toEqual(['open', 'overdue', 'overdue']);
    expect(filterSalesByStatus(all, 'open').map((s) => s.saleId)).toEqual([19]);
    expect(all[2].outstanding).toBe(106.2);
  });

  it('Venda: parcelas com situação e itens', () => {
    const d = buildSaleDetail(db.sales[0], db.clients, TODAY);
    expect(d.client?.name).toBe('Carla Menezes');
    expect(d.paidCount).toBe(0);
    expect(d.units).toBe(3);
    expect(d.installments.map((i) => i.status)).toEqual(['open', 'open', 'open']);
  });

  it('Clientes: busca sem acento e por telefone, rótulo Atrasado', () => {
    expect(buildClientList(db.clients, db.sales, TODAY).map((c) => c.hasOverdue)).toEqual([true, false, true]);
    expect(buildClientList(db.clients, db.sales, TODAY, 'fabio').map((c) => c.client.name)).toEqual(['Fábio Costa']);
    expect(buildClientList(db.clients, db.sales, TODAY, '99812').map((c) => c.client.name)).toEqual(['Carla Menezes']);
    expect(matchesSearch('(75) 9882', 'x', '75988205531')).toBe(true);
    expect(matchesSearch('(75) 9881', 'x', '75988205531')).toBe(false);
  });

  it('Cliente: totais', () => {
    const d = buildClientDetail(db.clients[0], db.sales, TODAY);
    expect([d.totalPurchased, d.salesCount, d.outstanding, d.hasOverdue]).toEqual([212.4, 1, 106.2, true]);
  });
});

describe('hooks/model: validação', () => {
  it('telefone segue a mesma regra do backend', () => {
    expect(normalizePhone('+55 (75) 99812-4410')).toBe('75998124410');
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('99812-4410')).toBeUndefined();
  });

  it('cliente: nome obrigatório e telefone válido', () => {
    expect(validateClientForm({ name: ' ', phone: '123' })).toEqual({
      ok: false,
      errors: { name: 'Informe o nome.', phone: expect.stringContaining('Telefone inválido') },
    });
    expect(validateClientForm({ name: ' Ana ', phone: '(75) 99134-2207' })).toEqual({ ok: true, value: { name: 'Ana', phone: '75991342207' } });
  });

  it('produto: preço em reais vira texto exato para o BigDecimal', () => {
    expect(validateProductForm({ name: 'Camiseta', price: '59,9' })).toEqual({ ok: true, value: { name: 'Camiseta', price: '59.90' } });
    expect(validateProductForm({ name: 'X', price: 'abc' }).ok).toBe(false);
  });

  it('pagamento: valor > 0 e data não futura', () => {
    expect(validatePaymentForm({ amount: '114,18', paidAt: TODAY }, TODAY)).toEqual({ ok: true, value: { paidAt: TODAY, paidAmount: '114.18' } });
    const r = validatePaymentForm({ amount: '0', paidAt: '2026-11-15' }, TODAY);
    expect(r.ok ? null : r.errors).toEqual({ amount: 'O valor deve ser maior que zero.', paidAt: 'Não pode ser uma data futura.' });
  });

  it('venda: remove itens zerados e exige cliente e item', () => {
    expect(validateSaleDraft({ clientId: 2, lines: [{ productId: 10, quantity: 2 }, { productId: 11, quantity: 0 }], installmentCount: 3 })).toEqual({
      ok: true,
      value: { clientId: 2, installmentCount: 3, items: [{ productId: 10, quantity: 2 }] },
    });
    const r = validateSaleDraft({ clientId: null, lines: [], installmentCount: 0 });
    expect(r.ok ? null : Object.keys(r.errors)).toEqual(['client', 'items', 'installments']);
  });

  it('links de contato', () => {
    expect(phoneHref('75998124410')).toBe('tel:+5575998124410');
    expect(whatsappHref(null)).toBeNull();
  });
});
