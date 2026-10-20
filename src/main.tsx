import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './router';
import { AuthProvider } from './store/AuthContext';
import { CatalogProvider } from './store/CatalogContext';
import { ToastProvider } from './store/ToastContext';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <CatalogProvider>
          <RouterProvider router={router} />
        </CatalogProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
);
