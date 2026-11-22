import { useMemo, useState } from 'react';
import type { Product } from '../types/api';
import { queryErrorMessage } from './core/errors';
import { useProductsData } from './data';
import { normalizeText } from './model/text';

export function filterProducts(products: Product[], search: string): Product[] {
  const query = normalizeText(search);
  return query ? products.filter((p) => normalizeText(p.name).includes(query)) : products;
}

/** Tela Produtos: lista com busca pelo nome e contagem ("6 produtos"). */
export function useProducts() {
  const [search, setSearch] = useState('');
  const products = useProductsData();
  const items = useMemo(() => filterProducts(products.data ?? [], search), [products.data, search]);

  return {
    items,
    search,
    setSearch,
    totalCount: products.data?.length ?? 0,
    isEmpty: products.data?.length === 0,
    loading: products.loading,
    refreshing: products.refreshing,
    error: queryErrorMessage(products.error),
    reload: products.reload,
  };
}
