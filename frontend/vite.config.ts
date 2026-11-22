import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// O build vai direto para os assets do Android: o NanoServer serve "assets/www"
// e devolve o index.html para qualquer rota que não seja arquivo (SPA fallback).
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: '../app/src/main/assets/www',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
