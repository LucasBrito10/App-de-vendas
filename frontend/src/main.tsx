import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { Gallery } from './dev/Gallery';

// Enquanto as páginas não existem, a raiz mostra a galeria de componentes.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
);
