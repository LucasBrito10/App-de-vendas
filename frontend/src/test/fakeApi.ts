// API falsa em memória para os testes: responde como o NanoServer + Gson.
import { vi } from 'vitest';
import type { Client, Installment, Product, SaleWithDetails } from '../types/api';

export interface FakeDb {
  clients: Client[];
  products: Product[];
  sales: SaleWithDetails[];
}

export interface Call {
  method: string;
  path: string;
  query: URLSearchParams;
  body: unknown;
  headers: Record<string, string>;
}

export function seed(): FakeDb {
  const inst = (installmentId: number, saleId: number, number: number, dueDate: string, amount: number, paidAt: string | null = null): Installment =>
    ({ installmentId, saleId, number, dueDate, amount, paidAt, paidAmount: paidAt ? amount : null });
  const item = (saleItemId: number, saleId: number, productId: number, productName: string, quantity: number, unitPrice: number) =>
    ({ item: { saleItemId, saleId, productId, productName, quantity, unitPrice }, product: null });
  return {
    clients: [
      { clientId: 1, name: 'Bruno Lima', phone: '75988205531' },
      { clientId: 2, name: 'Carla Menezes', phone: '75998124410' },
      { clientId: 3, name: 'Fábio Costa', phone: null },
    ],
    products: [
      { id: 10, name: 'Camiseta básica', price: 59.9 },
      { id: 11, name: 'Boné aba reta', price: 39.9 },
      { id: 12, name: 'Meia esportiva (par)', price: 14.5 },
      { id: 13, name: 'Brinde', price: null },
    ],
    // Mais recentes primeiro, como a API.
    sales: [
      {
        sale: { saleId: 19, clientId: 2, purchaseDate: '2026-11-13', createdAt: '2026-11-13T15:00:00Z', totalPrice: 342.5 },
        items: [item(1, 19, 10, 'Camiseta básica', 2, 59.9), item(2, 19, 11, 'Boné aba reta', 1, 39.9)],
        installments: [inst(191, 19, 1, '2026-12-13', 114.18), inst(192, 19, 2, '2027-01-12', 114.16), inst(193, 19, 3, '2027-02-11', 114.16)],
      },
      {
        sale: { saleId: 15, clientId: 3, purchaseDate: '2026-10-10', createdAt: '2026-10-10T15:00:00Z', totalPrice: 89.9 },
        items: [item(3, 15, 12, 'Meia esportiva (par)', 1, 89.9)],
        installments: [inst(151, 15, 1, '2026-11-09', 89.9)],
      },
      {
        sale: { saleId: 12, clientId: 1, purchaseDate: '2026-09-03', createdAt: '2026-09-03T15:00:00Z', totalPrice: 212.4 },
        items: [item(4, 12, 10, 'Camiseta básica', 1, 212.4)],
        installments: [inst(121, 12, 1, '2026-10-03', 106.2, '2026-10-01'), inst(122, 12, 2, '2026-11-02', 106.2)],
      },
    ],
  };
}

const json = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
  });

/** Instala o fetch falso. Retorna o banco (mutável) e o registro de chamadas. */
export function installFakeApi(db: FakeDb = seed()) {
  const calls: Call[] = [];
  let nextId = 1000;

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://127.0.0.1:8080');
    const method = (init?.method ?? 'GET').toUpperCase();
    const path = url.pathname.replace(/^\/api\/v1/, '');
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path, query: url.searchParams, body, headers: (init?.headers ?? {}) as Record<string, string> });

    if (method === 'GET' && path === '/clients') return json(200, db.clients);
    if (method === 'GET' && path === '/products') return json(200, db.products);
    if (method === 'GET' && path === '/sales') return json(200, db.sales);

    let m: RegExpMatchArray | null;
    if (method === 'POST' && path === '/clients') {
      const client = { clientId: nextId++, name: body.name, phone: body.phone ? body.phone.replace(/\D/g, '') : null };
      db.clients.push(client);
      return json(201, client);
    }
    if ((m = path.match(/^\/clients\/(\d+)$/))) {
      const id = Number(m[1]);
      const client = db.clients.find((c) => c.clientId === id);
      if (!client) return json(404, { error: 'Cliente não encontrado.' });
      if (method === 'DELETE') {
        db.clients = db.clients.filter((c) => c.clientId !== id);
        db.sales = db.sales.filter((s) => s.sale.clientId !== id);
        return new Response(null, { status: 204 });
      }
    }
    if (method === 'POST' && path === '/sales') {
      const saleId = nextId++;
      const created: SaleWithDetails = {
        sale: { saleId, clientId: body.clientId, purchaseDate: '2026-11-14', createdAt: '2026-11-14T12:00:00Z', totalPrice: 0 },
        items: [],
        installments: [],
      };
      db.sales.unshift(created);
      return json(201, created);
    }
    if ((m = path.match(/^\/sales\/installments\/(\d+)\/payment$/))) {
      const id = Number(m[1]);
      const installment = db.sales.flatMap((s) => s.installments).find((i) => i.installmentId === id);
      if (!installment) return json(404, { error: 'Parcela não encontrada.' });
      if (method === 'POST') {
        if (installment.paidAt) return json(409, { error: 'Esta parcela já está paga.' });
        installment.paidAt = body.paidAt;
        installment.paidAmount = Number(body.paidAmount);
        return json(200, installment);
      }
    }
    return json(404, { error: 'Endpoint não encontrado.' });
  });

  vi.stubGlobal('fetch', fetchMock);
  return { db, calls, fetchMock };
}
