// Endereços das telas. Use sempre estas funções em vez de montar a string na mão.
export const paths = {
  home: '/',
  clients: '/clientes',
  newClient: (returnTo?: 'venda') => `/clientes/novo${returnTo ? `?retorno=${returnTo}` : ''}`,
  client: (id: number) => `/clientes/${id}`,
  editClient: (id: number) => `/clientes/${id}/editar`,
  sales: '/vendas',
  /** fresh = começa do zero; clientId = "Nova venda para Carla"; sem nada = continua o rascunho. */
  newSale: (opts: { fresh?: boolean; clientId?: number } = {}) =>
    opts.clientId !== undefined ? `/vendas/nova?clienteId=${opts.clientId}` : opts.fresh ? '/vendas/nova?nova=1' : '/vendas/nova',
  sale: (id: number) => `/vendas/${id}`,
  overdue: '/atrasados',
  products: '/produtos',
  newProduct: (returnTo?: 'venda') => `/produtos/novo${returnTo ? `?retorno=${returnTo}` : ''}`,
  editProduct: (id: number) => `/produtos/${id}`,
  export: '/exportar',
} as const;
