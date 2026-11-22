// Camada HOOKS: estado das telas, regras, validação e montagem dos dados para os components.
// As telas (pages) usam só estes hooks + components; nunca chamam a camada services direto.
//
//   components  ← dados prontos (strings, números, status) e callbacks
//   hooks       ← este módulo
//   services    ← uma função por endpoint (HTTP)

// Telas
export * from './useDashboard';
export * from './useClients';
export * from './useClientDetail';
export * from './useClientForm';
export * from './useProducts';
export * from './useProductForm';
export * from './useSales';
export * from './useSaleDetail';
export * from './usePayment';
export * from './useOverdue';
export * from './useNewSale';
export * from './useExport';

// Base (para hooks novos)
export { useQuery, combineQueries, type QueryResult } from './core/useQuery';
export { useMutation, type MutationOutcome, type MutationResult } from './core/useMutation';
export { invalidate } from './core/queryCache';
export { queryKeys } from './core/keys';
export { errorMessage } from './core/errors';
export { useToday } from './core/useToday';

// Modelos e utilitários usados pelas telas
export * from './model/viewModels';
export * from './model/validation';
export { phoneHref, whatsappHref, reminderMessage } from './model/contact';
