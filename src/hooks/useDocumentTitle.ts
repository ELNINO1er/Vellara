import { useEffect } from 'react';
import { useCatalog } from '../store/CatalogContext';

/** Titre d'onglet : « Page — Nom de l'entreprise ». */
export function useDocumentTitle(title: string) {
  const { data } = useCatalog();
  const company = data.settings.companyName;
  useEffect(() => {
    document.title = title ? `${title} — ${company}` : company;
  }, [title, company]);
}
