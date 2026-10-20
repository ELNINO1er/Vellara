import { createBrowserRouter } from 'react-router';
import { RequireAdmin } from './layouts/AdminLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { LoginPage } from './pages/admin/LoginPage';
import { MediaPage } from './pages/admin/MediaPage';
import { MedicineEditorPage } from './pages/admin/medicine-editor/MedicineEditorPage';
import { MedicinesPage } from './pages/admin/MedicinesPage';
import { ReferencesPage } from './pages/admin/ReferencesPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { SharesPage } from './pages/admin/SharesPage';
import { CatalogPage } from './pages/public/CatalogPage';
import { ContactPage } from './pages/public/ContactPage';
import { HomePage } from './pages/public/HomePage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { ProductPage } from './pages/public/ProductPage';
import { SharedProductPage } from './pages/public/SharedProductPage';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalogue', element: <CatalogPage /> },
      { path: 'catalogue/:slug', element: <ProductPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: 'partage/:token', element: <SharedProductPage /> },
  { path: 'admin/connexion', element: <LoginPage /> },
  {
    path: 'admin',
    element: <RequireAdmin />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'medicaments', element: <MedicinesPage /> },
      { path: 'medicaments/nouveau', element: <MedicineEditorPage /> },
      { path: 'medicaments/:id', element: <MedicineEditorPage /> },
      { path: 'categories', element: <ReferencesPage kind="categories" key="categories" /> },
      { path: 'laboratoires', element: <ReferencesPage kind="laboratories" key="laboratories" /> },
      { path: 'documents', element: <MediaPage /> },
      { path: 'partages', element: <SharesPage /> },
      { path: 'parametres', element: <SettingsPage /> },
    ],
  },
]);
