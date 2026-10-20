import { MEDICAL_PLACEHOLDER } from '../config/brand';
import type { CatalogData, Category, Laboratory, Medicine } from '../types/catalog';
import { normalize } from './text';
import { parseVideoUrl } from './video';

export type VideoFilter = 'all' | 'with' | 'without';
export type CatalogSort = 'name' | 'updated' | 'category';

export interface CatalogFilters {
  q: string;
  category: string;
  form: string;
  lab: string;
  video: VideoFilter;
  sort: CatalogSort;
}

export const DEFAULT_FILTERS: CatalogFilters = { q: '', category: '', form: '', lab: '', video: 'all', sort: 'name' };

export interface Lookups {
  categories: Map<string, Category>;
  laboratories: Map<string, Laboratory>;
}

export function buildLookups(data: Pick<CatalogData, 'categories' | 'laboratories'>): Lookups {
  return {
    categories: new Map(data.categories.map((c) => [c.id, c])),
    laboratories: new Map(data.laboratories.map((l) => [l.id, l])),
  };
}

export const categoryName = (m: Medicine, l: Lookups) => l.categories.get(m.categoryId)?.name ?? 'Catégorie à préciser';
export const laboratoryName = (m: Medicine, l: Lookups) => l.laboratories.get(m.laboratoryId)?.name ?? 'Laboratoire à préciser';
export const hasVideo = (m: Medicine) => parseVideoUrl(m.videoUrl) !== null;
export const isPublished = (m: Medicine) => m.status === 'published';

export function isMedicalPlaceholder(text: string): boolean {
  return !text.trim() || text.trim() === MEDICAL_PLACEHOLDER;
}

export function medicalTodoCount(m: Medicine): number {
  const { indications, contraindications, precautions, adverseEffects } = m.medical;
  return [indications, contraindications, precautions, adverseEffects].filter(isMedicalPlaceholder).length;
}

export function matchesQuery(m: Medicine, query: string, l: Lookups): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  return [m.name, m.activeSubstance, laboratoryName(m, l)].some((field) => normalize(field).includes(q));
}

/** Filtre + tri du catalogue public. Fonction pure, testée. */
export function filterCatalog(medicines: Medicine[], f: CatalogFilters, l: Lookups): Medicine[] {
  const result = medicines.filter(
    (m) =>
      matchesQuery(m, f.q, l) &&
      (!f.category || m.categoryId === f.category) &&
      (!f.form || m.dosageForm === f.form) &&
      (!f.lab || m.laboratoryId === f.lab) &&
      (f.video === 'all' || (f.video === 'with') === hasVideo(m)),
  );
  return sortMedicines(result, f.sort, l);
}

export function sortMedicines(list: Medicine[], sort: CatalogSort | 'status', l: Lookups): Medicine[] {
  const byName = (a: Medicine, b: Medicine) => a.name.localeCompare(b.name, 'fr');
  const copy = [...list];
  switch (sort) {
    case 'updated':
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case 'category':
      return copy.sort((a, b) => categoryName(a, l).localeCompare(categoryName(b, l), 'fr') || byName(a, b));
    case 'status':
      return copy.sort((a, b) => Number(isPublished(a)) - Number(isPublished(b)) || byName(a, b));
    default:
      return copy.sort(byName);
  }
}

export function activeFilterCount(f: CatalogFilters): number {
  return [f.q.trim(), f.category, f.form, f.lab, f.video !== 'all' ? 'v' : ''].filter(Boolean).length;
}

export function shareLink(baseUrl: string, m: Pick<Medicine, 'slug'>): string {
  return `${baseUrl.replace(/\/+$/, '')}/catalogue/${m.slug}`;
}
