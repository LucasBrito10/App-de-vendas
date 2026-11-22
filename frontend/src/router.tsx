import { lazy, Suspense, useEffect } from 'react';
import { createBrowserRouter, Outlet, useLocation } from 'react-router-dom';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { ClientFormPage } from './pages/ClientFormPage';
import { ClientsPage } from './pages/ClientsPage';
import { ExportPage } from './pages/ExportPage';
import { HomePage } from './pages/HomePage';
import { NewSalePage } from './pages/NewSalePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OverduePage } from './pages/OverduePage';
import { ProductFormPage } from './pages/ProductFormPage';
import { ProductsPage } from './pages/ProductsPage';
import { SaleDetailPage } from './pages/SaleDetailPage';
import { SalesPage } from './pages/SalesPage';

// Galeria de componentes: só no modo de desenvolvimento (fora do build do app).
const Gallery = import.meta.env.DEV ? lazy(() => import('./dev/Gallery').then((m) => ({ default: m.Gallery }))) : null;

/** Cada tela abre no topo (o navegador manteria a rolagem da tela anterior). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Root() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

// Os endereços batem com os de pages/shared/paths.ts. O NanoServer devolve o index.html
// para qualquer rota que não seja arquivo, então recarregar em qualquer tela funciona.
export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/clientes', element: <ClientsPage /> },
      { path: '/clientes/novo', element: <ClientFormPage /> },
      { path: '/clientes/:id', element: <ClientDetailPage /> },
      { path: '/clientes/:id/editar', element: <ClientFormPage /> },
      { path: '/vendas', element: <SalesPage /> },
      { path: '/vendas/nova', element: <NewSalePage /> },
      { path: '/vendas/:id', element: <SaleDetailPage /> },
      { path: '/atrasados', element: <OverduePage /> },
      { path: '/produtos', element: <ProductsPage /> },
      { path: '/produtos/novo', element: <ProductFormPage /> },
      { path: '/produtos/:id', element: <ProductFormPage /> },
      { path: '/exportar', element: <ExportPage /> },
      ...(Gallery
        ? [{ path: '/dev/galeria', element: <Suspense fallback={null}><Gallery /></Suspense> }]
        : []),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
