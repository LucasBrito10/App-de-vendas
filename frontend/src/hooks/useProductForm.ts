import { useEffect, useState } from 'react';
import type { Product } from '../types/api';
import { formatDecimal } from '../lib/format';
import { productService } from '../services/productService';
import { queryKeys } from './core/keys';
import { useMutation } from './core/useMutation';
import { queryErrorMessage } from './core/errors';
import { useProductsData } from './data';
import { validateProductForm, type FieldErrors, type ProductForm } from './model/validation';

const EMPTY: ProductForm = { name: '', price: '' };

/**
 * Telas Novo produto / Editar produto.
 * Mudar o preço não altera vendas já registradas (o backend guarda o preço da época).
 */
export function useProductForm(productId?: number) {
  const isEdit = productId !== undefined;
  const products = useProductsData();
  const product = isEdit ? products.data?.find((p) => p.id === productId) : undefined;

  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<keyof ProductForm>>({});
  const [loadedId, setLoadedId] = useState<number | null>(null);

  useEffect(() => {
    if (product && loadedId !== product.id) {
      setForm({ name: product.name, price: product.price == null ? '' : formatDecimal(product.price) });
      setLoadedId(product.id);
    }
  }, [product, loadedId]);

  const save = useMutation(
    (input: { name: string; price: string }) =>
      isEdit ? productService.update(productId, input) : productService.create(input),
    [queryKeys.products],
  );
  const remove = useMutation(() => productService.remove(productId!), [queryKeys.products]);

  function setField<K extends keyof ProductForm>(field: K, value: ProductForm[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    save.reset();
  }

  async function submit(): Promise<Product | undefined> {
    const result = validateProductForm(form);
    if (!result.ok) {
      setErrors(result.errors);
      return undefined;
    }
    const outcome = await save.run({ name: result.value.name!, price: String(result.value.price) });
    return outcome.ok ? outcome.data : undefined;
  }

  async function deleteProduct(): Promise<boolean> {
    if (!isEdit) return false;
    return (await remove.run()).ok;
  }

  return {
    isEdit,
    form,
    errors,
    setField,
    submit,
    saving: save.loading,
    saveError: save.error,
    deleteProduct,
    deleting: remove.loading,
    deleteError: remove.error,
    resetDeleteError: remove.reset,
    loading: isEdit && products.loading,
    notFound: isEdit && products.data !== undefined && !product,
    loadError: queryErrorMessage(products.error),
  };
}
