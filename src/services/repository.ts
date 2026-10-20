import { createSeedData } from '../data/seed';
import type { CatalogData } from '../types/catalog';

/**
 * Point d'accès unique aux données. En production, remplacer
 * `LocalStorageRepository` par une implémentation API (REST/GraphQL)
 * respectant la même interface : le reste de l'application ne change pas.
 */
export interface CatalogRepository {
  load(): CatalogData;
  save(data: CatalogData): { ok: true } | { ok: false; reason: 'quota' | 'unavailable' };
  reset(): CatalogData;
}

// Version incrémentée quand les données de démonstration changent.
const STORAGE_KEY = 'vellara.catalog.v2';

function isCatalogData(value: unknown): value is CatalogData {
  const v = value as CatalogData;
  return (
    !!v &&
    v.version === 1 &&
    Array.isArray(v.medicines) &&
    Array.isArray(v.categories) &&
    Array.isArray(v.laboratories) &&
    typeof v.settings === 'object'
  );
}

export class LocalStorageRepository implements CatalogRepository {
  load(): CatalogData {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isCatalogData(parsed)) return { ...parsed, contactRequests: parsed.contactRequests ?? [], shares: parsed.shares ?? createSeedData().shares };
      }
    } catch {
      /* stockage illisible : on repart des données de démonstration */
    }
    return createSeedData();
  }

  save(data: CatalogData) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return { ok: true } as const;
    } catch (error) {
      const quota = error instanceof DOMException && /quota/i.test(error.name);
      return { ok: false, reason: quota ? 'quota' : 'unavailable' } as const;
    }
  }

  reset(): CatalogData {
    const data = createSeedData();
    this.save(data);
    return data;
  }
}

export const repository: CatalogRepository = new LocalStorageRepository();
