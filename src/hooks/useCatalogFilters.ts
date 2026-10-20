import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { DEFAULT_FILTERS, type CatalogFilters, type CatalogSort, type VideoFilter } from '../lib/catalog';

/**
 * Filtres du catalogue synchronisés avec l'URL (?q=…&categorie=…),
 * pour qu'une recherche filtrée puisse être partagée ou mise en favori.
 */
const PARAMS: Record<keyof CatalogFilters, string> = {
  q: 'q',
  category: 'categorie',
  form: 'forme',
  lab: 'laboratoire',
  video: 'video',
  sort: 'tri',
};

const VIDEO_VALUES: Record<string, VideoFilter> = { avec: 'with', sans: 'without' };
const VIDEO_PARAMS: Record<VideoFilter, string> = { all: '', with: 'avec', without: 'sans' };
const SORT_VALUES: Record<string, CatalogSort> = { nom: 'name', recent: 'updated', categorie: 'category' };
const SORT_PARAMS: Record<CatalogSort, string> = { name: '', updated: 'recent', category: 'categorie' };

export function useCatalogFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<CatalogFilters>(
    () => ({
      q: params.get(PARAMS.q) ?? '',
      category: params.get(PARAMS.category) ?? '',
      form: params.get(PARAMS.form) ?? '',
      lab: params.get(PARAMS.lab) ?? '',
      video: VIDEO_VALUES[params.get(PARAMS.video) ?? ''] ?? 'all',
      sort: SORT_VALUES[params.get(PARAMS.sort) ?? ''] ?? 'name',
    }),
    [params],
  );

  const update = useCallback(
    (patch: Partial<CatalogFilters>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          (Object.keys(patch) as (keyof CatalogFilters)[]).forEach((key) => {
            const raw = patch[key] ?? '';
            const value =
              key === 'video' ? VIDEO_PARAMS[raw as VideoFilter] : key === 'sort' ? SORT_PARAMS[raw as CatalogSort] : String(raw);
            if (value) next.set(PARAMS[key], value);
            else next.delete(PARAMS[key]);
          });
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setParams],
  );

  const reset = useCallback(
    () => update({ q: '', category: '', form: '', lab: '', video: DEFAULT_FILTERS.video }),
    [update],
  );

  const view = params.get('vue') === 'liste' ? 'list' : 'grid';
  const setView = useCallback(
    (v: 'grid' | 'list') =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (v === 'list') next.set('vue', 'liste');
          else next.delete('vue');
          return next;
        },
        { replace: true, preventScrollReset: true },
      ),
    [setParams],
  );

  return { filters, update, reset, view: view as 'grid' | 'list', setView };
}
