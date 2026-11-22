// Chaves do cache. Os hooks de leitura usam estas; as escritas invalidam por elas.
export const queryKeys = {
  clients: 'clients',
  products: 'products',
  sales: 'sales',
} as const;
