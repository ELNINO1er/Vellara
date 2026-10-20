import { useMemo } from 'react';
import { ProductCard, ProductRow } from '../../components/product/ProductCard';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Feedback';
import { InlineSelect } from '../../components/ui/Field';
import { Select, type SelectOption } from '../../components/ui/Select';
import { Icon } from '../../components/ui/Icon';
import { Segmented } from '../../components/ui/Segmented';
import { useCatalogFilters } from '../../hooks/useCatalogFilters';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { activeFilterCount, filterCatalog, isPublished, type CatalogSort, type VideoFilter } from '../../lib/catalog';
import { swatchAt } from '../../lib/palette';
import { useCatalog } from '../../store/CatalogContext';

export function CatalogPage() {
  useDocumentTitle('Catalogue');
  const { data, lookups } = useCatalog();
  const { filters, update, reset, view, setView } = useCatalogFilters();

  const published = useMemo(() => data.medicines.filter(isPublished), [data.medicines]);
  const results = useMemo(() => filterCatalog(published, filters, lookups), [published, filters, lookups]);
  const forms = useMemo(() => [...new Set(published.map((m) => m.dosageForm))].sort((a, b) => a.localeCompare(b, 'fr')), [published]);
  const activeCount = activeFilterCount(filters);

  const chips = [
    filters.q.trim() && { label: `« ${filters.q.trim()} »`, clear: () => update({ q: '' }) },
    filters.category && { label: lookups.categories.get(filters.category)?.name ?? filters.category, clear: () => update({ category: '' }) },
    filters.form && { label: filters.form, clear: () => update({ form: '' }) },
    filters.lab && { label: lookups.laboratories.get(filters.lab)?.name ?? filters.lab, clear: () => update({ lab: '' }) },
    filters.video !== 'all' && { label: filters.video === 'with' ? 'Avec vidéo' : 'Sans vidéo', clear: () => update({ video: 'all' }) },
  ].filter((c): c is { label: string; clear: () => void } => !!c);

  return (
    <>
      <section className="border-b border-sand-200 pt-12 pb-8">
        <div className="container-page">
          <p className="eyebrow">Catalogue</p>
          <h1 className="display text-[clamp(44px,5.4vw,72px)]">Toutes nos spécialités</h1>
          <form role="search" className="relative mt-7 max-w-[760px]" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="catalog-search" className="sr-only">
              Rechercher un médicament
            </label>
            <Icon name="search" className="absolute top-1/2 left-[21px] -translate-y-1/2 text-muted" />
            <input
              id="catalog-search"
              type="search"
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Nom, substance active (DCI) ou laboratoire…"
              className="h-[60px] w-full rounded-full border-[1.5px] border-sand-300 bg-white pr-6 pl-14 text-[17px] transition-[border-color,box-shadow] placeholder:text-[#6A7A86] focus:border-navy focus:shadow-[0_0_0_4px_rgba(102,155,188,.35)] focus:outline-none"
            />
          </form>
        </div>
      </section>

      <div className="container-page flex flex-wrap items-start gap-10 pt-9 pb-[88px]">
        {/* Filtres */}
        <aside aria-label="Filtres" className="flex flex-[1_1_250px] flex-col gap-7">
          <div>
            <h2 id="filter-category" className="mb-2.5 text-xs font-semibold tracking-[0.15em] text-navy uppercase">
              Catégorie thérapeutique
            </h2>
            <div role="group" aria-labelledby="filter-category" className="flex flex-col gap-0.5">
              {[{ id: '', name: 'Toutes les catégories', swatch: -1 }, ...data.categories].map((c) => {
                const count = c.id ? published.filter((m) => m.categoryId === c.id).length : published.length;
                const pressed = filters.category === c.id;
                return (
                  <button
                    key={c.id || 'all'}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => update({ category: pressed && c.id ? '' : c.id })}
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left transition-colors hover:bg-sand-100 aria-pressed:bg-navy aria-pressed:text-white"
                  >
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: c.swatch < 0 ? '#D6C49F' : swatchAt(c.swatch).base }} aria-hidden="true" />
                    {c.name}
                    <span className={`ml-auto font-mono text-[12.5px] ${pressed ? 'text-[#CFE0EB]' : 'text-muted'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <FilterSelect
            label="Forme pharmaceutique"
            value={filters.form}
            onChange={(form) => update({ form })}
            options={[{ value: '', label: 'Toutes les formes' }, ...forms.map((f) => ({ value: f, label: f, count: published.filter((m) => m.dosageForm === f).length }))]}
          />
          <FilterSelect
            label="Laboratoire"
            value={filters.lab}
            onChange={(lab) => update({ lab })}
            options={[{ value: '', label: 'Tous les laboratoires' }, ...data.laboratories.map((l) => ({ value: l.id, label: l.name, count: published.filter((m) => m.laboratoryId === l.id).length }))]}
          />
          <div>
            <p className="mb-2.5 text-xs font-semibold tracking-[0.15em] text-navy uppercase">Présentation vidéo</p>
            <Segmented<VideoFilter>
              label="Présentation vidéo"
              value={filters.video}
              onChange={(video) => update({ video })}
              options={[
                { value: 'all', label: 'Toutes' },
                { value: 'with', label: 'Avec vidéo' },
                { value: 'without', label: 'Sans' },
              ]}
            />
          </div>
          <Button variant="ghost" icon="reset" onClick={reset} disabled={activeCount === 0}>
            Réinitialiser les filtres
          </Button>
        </aside>

        {/* Résultats */}
        <section aria-label="Résultats" className="min-w-0 flex-[999_1_560px]">
          <div className="mb-[18px] flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <p className="text-[15px] text-ink-soft" role="status">
              <strong className="text-[26px] font-bold text-navy [font-stretch:76%]">{results.length}</strong>{' '}
              {results.length > 1 ? 'médicaments' : 'médicament'} <span className="text-muted">sur {published.length} publiés</span>
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <InlineSelect
                label="Trier les résultats"
                value={filters.sort}
                onChange={(v) => update({ sort: v as CatalogSort })}
                options={[
                  { value: 'name', label: 'Nom (A → Z)' },
                  { value: 'updated', label: 'Mises à jour récentes' },
                  { value: 'category', label: 'Catégorie' },
                ]}
              />
              <Segmented<'grid' | 'list'>
                label="Mode d’affichage"
                value={view}
                onChange={setView}
                options={[
                  { value: 'grid', label: <><Icon name="grid" size={17} />Grille</> },
                  { value: 'list', label: <><Icon name="list" size={17} />Liste</> },
                ]}
              />
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mb-[22px] flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={c.clear}
                  aria-label={`Retirer le filtre ${c.label}`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-sand-300 bg-white pr-2 pl-3.5 text-sm hover:border-bordeaux hover:text-bordeaux"
                >
                  {c.label}
                  <Icon name="close" size={15} />
                </button>
              ))}
            </div>
          )}

          {results.length === 0 ? (
            <EmptyState
              title="Aucun médicament ne correspond à votre recherche"
              action={activeCount > 0 && <Button onClick={reset}>Réinitialiser la recherche et les filtres</Button>}
            >
              Vérifiez l’orthographe, essayez la substance active ou le laboratoire, ou élargissez les filtres.
            </EmptyState>
          ) : view === 'grid' ? (
            <div className="grid gap-[22px] [grid-template-columns:repeat(auto-fill,minmax(236px,1fr))]">
              {results.map((m) => (
                <ProductCard key={m.id} medicine={m} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {results.map((m) => (
                <ProductRow key={m.id} medicine={m} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}) {
  const id = `filter-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div>
      <span id={`${id}-label`} className="mb-2.5 block text-xs font-semibold tracking-[0.15em] text-navy uppercase">
        {label}
      </span>
      <Select id={id} labelledBy={`${id}-label`} value={value} onChange={onChange} options={options} />
    </div>
  );
}
