// Contrato entre a camada service e a camada de componentes.
// Espelha EXATAMENTE o JSON que o backend (Gson) produz: o Gson serializa os CAMPOS das
// classes Java (não os getters), então os nomes abaixo seguem os campos.
//
// Convenções do backend:
//  - Dinheiro (BigDecimal) chega como número JSON com 2 casas: 342.5 / 114.18.
//  - Datas (LocalDate) chegam como texto ISO "AAAA-MM-DD". Instant chega como ISO com hora (UTC).
//  - Erros chegam como { "error": "mensagem" } com status 400, 404, 409 ou 500.
//  - DELETE bem-sucedido responde 204 sem corpo (não chame response.json()).
//  - Atualizações usam POST em /recurso/{id} (não há PUT/PATCH).

/** Data no formato "AAAA-MM-DD". */
export type IsoDate = string;
/** Data/hora ISO-8601 em UTC ("2026-11-13T14:02:11.123Z"). */
export type IsoInstant = string;
/** Valor em reais vindo de um BigDecimal (ex.: 342.5). */
export type Money = number;

export interface ApiError {
  error: string;
}

// ---------------------------------------------------------------- Clientes
// GET  /api/v1/clients[?name=|?phone=|?page=&size=]  → Client[]  (com ?phone= sem paginação → Client | null)
//      ?phone= aceita qualquer formatação: "(75) 99812-4410" e "75998124410" encontram o mesmo cliente.
// GET  /api/v1/clients/{id}                         → Client
// GET  /api/v1/clients/{id}?withSales=true          → ClientWithSales
// POST /api/v1/clients                              → Client (201); 400 sem nome ou telefone inválido
// POST /api/v1/clients/{id}                         → Client (atualização parcial)
// DELETE /api/v1/clients/{id}                       → 204 (apaga vendas e parcelas em cascata)

/** ClientDto. Atenção: o id se chama `clientId` (no produto é `id`). */
export interface Client {
  clientId: number;
  name: string;
  /**
   * Só dígitos, com DDD e sem +55: "75998124410" (10 ou 11 dígitos). Exiba com formatPhone().
   * null = não informado.
   */
  phone: string | null;
}

export interface ClientInput {
  /** Obrigatório no cadastro. */
  name?: string;
  /** Qualquer formatação; o backend guarda só os dígitos. "" na edição apaga o telefone. */
  phone?: string;
}

/**
 * ClientWithSalesDto. As vendas aqui são `Sale` "crua", SEM parcelas, então não dá para saber
 * o que está em aberto. Para o detalhe do cliente use GET /api/v1/sales?clientId={id}.
 */
export interface ClientWithSales {
  client: Client;
  sales: Sale[];
}

// ---------------------------------------------------------------- Produtos
// GET  /api/v1/products[?name=|?page=&size=]  → Product[]
// GET  /api/v1/products/{id}                  → Product
// POST /api/v1/products                       → Product (201)
// POST /api/v1/products/{id}                  → Product (atualização parcial)
// DELETE /api/v1/products/{id}                → 204 (vendas antigas mantêm nome e preço)

/** ProductDto. Atenção: o id se chama `id`. */
export interface Product {
  id: number;
  name: string;
  price: Money | null;
}

export interface ProductInput {
  name?: string;
  /** Pode ser número ou texto ("59.90"); nunca negativo. */
  price?: Money | string;
}

/** Entidade Product, como aparece aninhada em SaleItemWithProduct. */
export interface ProductEntity {
  productId: number;
  name: string;
  price: Money | null;
}

// ---------------------------------------------------------------- Vendas
// GET  /api/v1/sales[?clientId=&startDate=&endDate=&page=&size=]  → SaleWithDetails[]
//      (startDate e endDate andam juntos; ordem: data da compra desc, id desc)
// GET  /api/v1/sales/{id}                    → SaleWithDetails
// GET  /api/v1/sales/{id}/items              → SaleItemWithProduct[]
// GET  /api/v1/sales/{id}/installments       → Installment[]
// POST /api/v1/sales                         → SaleWithDetails (201)
// POST /api/v1/sales/{id}                    → 405: venda não é editável
// DELETE /api/v1/sales/{id}                  → 204

export interface Sale {
  saleId: number;
  clientId: number;
  purchaseDate: IsoDate;
  createdAt: IsoInstant;
  totalPrice: Money;
}

export interface SaleItem {
  saleItemId: number;
  saleId: number;
  /** null se o produto foi excluído do catálogo. */
  productId: number | null;
  /** Nome no momento da venda: use SEMPRE este, não o do produto. */
  productName: string;
  quantity: number;
  /** Preço no momento da venda: use SEMPRE este, não o do produto. */
  unitPrice: Money;
}

export interface SaleItemWithProduct {
  item: SaleItem;
  /** null se o produto foi excluído. */
  product: ProductEntity | null;
}

/** Venda completa. Não traz o nome do cliente: cruze `sale.clientId` com a lista de clientes. */
export interface SaleWithDetails {
  sale: Sale;
  items: SaleItemWithProduct[];
  installments: Installment[];
}

export interface SaleItemInput {
  productId: number;
  /** >= 1. Itens com quantidade 0 devem ser removidos antes de enviar. */
  quantity: number;
}

export interface SaleInput {
  clientId: number;
  /** Opcional (padrão: hoje). Não pode ser futura. */
  purchaseDate?: IsoDate;
  /** Opcional (padrão: 1). Entre 1 e MAX_INSTALLMENTS. */
  installmentCount?: number;
  items: SaleItemInput[];
}

// ---------------------------------------------------------------- Parcelas
// GET    /api/v1/sales/installments/{id}                         → Installment
// GET    /api/v1/sales/installments/overdue                      → Installment[] (mais antigas primeiro)
// GET    /api/v1/sales/installments/pending?startDate=&endDate=  → Installment[] (datas obrigatórias)
// POST   /api/v1/sales/installments/{id}/payment                 → Installment (409 se já paga)
// DELETE /api/v1/sales/installments/{id}/payment                 → Installment (desfaz; 409 se não paga)

export interface Installment {
  installmentId: number;
  saleId: number;
  /** 1, 2, 3... */
  number: number;
  dueDate: IsoDate;
  amount: Money;
  /** null = não paga. */
  paidAt: IsoDate | null;
  /** null = não paga. */
  paidAmount: Money | null;
}

export interface PaymentInput {
  /** Opcional (padrão: hoje). Não pode ser futura. */
  paidAt?: IsoDate;
  /** Opcional (padrão: valor integral). Maior que zero. */
  paidAmount?: Money | string;
}

// ---------------------------------------------------------------- Exportação (CSV)
// GET /api/v1/export/sales?clientId=&startDate=&endDate=
// GET /api/v1/export/sale-items?clientId=&startDate=&endDate=   (uma linha por produto vendido)
// GET /api/v1/export/installments?clientId=&startDate=&endDate=&status=all|pending|overdue|paid
// GET /api/v1/export/clients
// GET /api/v1/export/products
// O download é feito pelo app Android (DownloadListener da WebView): abra a URL por navegação
// (<a href download> / LinkButton), NÃO com fetch, senão o arquivo não é salvo.

export type ExportKind = 'sales' | 'sale-items' | 'installments' | 'clients' | 'products';
export type ExportInstallmentStatus = 'all' | 'pending' | 'overdue' | 'paid';

// ---------------------------------------------------------------- Derivados no frontend
/** Estado de pagamento calculado a partir das parcelas (ver lib/sale.ts). O backend não envia. */
export type PaymentStatus = 'paid' | 'open' | 'overdue';
