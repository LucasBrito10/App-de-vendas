// Camada SERVICE: uma função por endpoint, sem estado nem regra de negócio.
// Quem consome é a camada hooks; components e telas não devem importar daqui.
export * from './http';
export * from './endpoints';
export * from './clientService';
export * from './productService';
export * from './saleService';
export * from './installmentService';
export * from './exportService';
