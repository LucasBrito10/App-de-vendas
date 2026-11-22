// Leituras compartilhadas. Todas as telas usam estas três listas e montam o resto localmente.
// Para o volume de um app pessoal (centenas ou poucos milhares de vendas) é rápido e mantém
// tudo consistente; se crescer muito, troque por consultas filtradas da camada service.
import { clientService } from '../services/clientService';
import { productService } from '../services/productService';
import { saleService } from '../services/saleService';
import { queryKeys } from './core/keys';
import { useQuery } from './core/useQuery';

export const useClientsData = () => useQuery(queryKeys.clients, () => clientService.list());
export const useProductsData = () => useQuery(queryKeys.products, () => productService.list());
export const useSalesData = () => useQuery(queryKeys.sales, () => saleService.list());
