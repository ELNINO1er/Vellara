import { Link } from 'react-router';
import { ButtonLink } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Feedback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { AdminHeader } from '../../layouts/AdminLayout';
import { hasVideo, isPublished, medicalTodoCount } from '../../lib/catalog';
import { formatLongDate } from '../../lib/date';
import { swatchAt } from '../../lib/palette';
import { plural } from '../../lib/text';
import { useCatalog } from '../../store/CatalogContext';

const pct = (a: number, b: number) => `${b ? Math.round((a * 100) / b) : 0} %`;

export function DashboardPage() {
  useDocumentTitle('Tableau de bord');
  const { data, lookups } = useCatalog();
  const meds = data.medicines;
  const published = meds.filter(isPublished).length;
  const drafts = meds.length - published;
  const withVideo = meds.filter(hasVideo).length;

  const kpis = [
    { label: 'Médicaments', value: meds.length, sub: 'fiches au total', bar: '#003049' },
    { label: 'Fiches publiées', value: published, sub: `${pct(published, meds.length)} du catalogue`, bar: '#669BBC' },
    { label: 'Brouillons', value: drafts, sub: drafts ? 'en attente de publication' : 'aucun brouillon en attente', bar: '#E2C58C', accent: true },
    { label: 'Avec vidéo', value: withVideo, sub: `${pct(withVideo, meds.length)} des fiches`, bar: '#C1121F' },
  ];

  const attention = [
    { n: drafts, label: 'brouillon(s) à relire avant publication', to: '/admin/medicaments?statut=brouillon' },
    { n: meds.filter((m) => medicalTodoCount(m) > 0).length, label: 'fiche(s) avec informations médicales à compléter', to: '/admin/medicaments' },
    { n: meds.filter((m) => !m.leaflet && !m.brochure).length, label: 'fiche(s) sans notice ni brochure', to: '/admin/documents' },
    { n: data.contactRequests.length, label: 'demande(s) de contact reçue(s)', to: '/admin/documents#demandes' },
  ];

  const perCategory = data.categories.map((c) => ({ ...c, count: meds.filter((m) => m.categoryId === c.id).length }));
  const max = Math.max(1, ...perCategory.map((c) => c.count));
  const recent = [...meds].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  return (
    <>
      <AdminHeader
        title="Tableau de bord"
        subtitle="Indicateurs calculés en direct à partir des fiches du catalogue."
        actions={
          <>
            <ButtonLink to="/catalogue" variant="ghost">
              Voir le catalogue
            </ButtonLink>
            <ButtonLink to="/admin/medicaments/nouveau" icon="plus">
              Nouveau médicament
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="surface relative flex flex-col gap-1 overflow-hidden px-6 py-[22px]">
            <span className="absolute inset-x-0 top-0 h-[5px]" style={{ background: k.bar }} />
            <span className="text-[15px] font-semibold text-navy">{k.label}</span>
            <span className={`mt-3.5 text-[48px] leading-none font-extrabold [font-stretch:68%] sm:text-[62px] ${k.accent ? 'text-bordeaux' : 'text-navy'}`}>{k.value}</span>
            <span className="text-[13.5px] text-muted">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {attention.map((a) => (
          <Link key={a.label} to={a.to} className="surface flex flex-col items-start gap-1.5 rounded-[18px] p-[18px] transition-colors hover:border-bordeaux">
            <b className="text-[34px] leading-none font-extrabold text-bordeaux [font-stretch:72%]">{a.n}</b>
            <span className="text-[13.5px] leading-snug text-ink-soft">{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className="surface px-[26px] py-6" aria-labelledby="by-cat">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="by-cat" className="heading-card">
              Répartition par catégorie
            </h2>
            <Link to="/admin/categories" className="font-semibold text-bordeaux underline underline-offset-4">
              Gérer
            </Link>
          </div>
          <ul className="flex flex-col gap-1">
            {perCategory.map((c) => (
              <li key={c.id} className="grid grid-cols-[minmax(110px,170px)_minmax(0,1fr)_34px] items-center gap-3.5 py-1.5 text-[14.5px]">
                <span>{c.name}</span>
                <span className="h-3 overflow-hidden rounded-full bg-[#F3E9D5]" role="img" aria-label={`${c.name} : ${plural(c.count, 'fiche', 'fiches')}`}>
                  <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${(c.count * 100) / max}%`, background: swatchAt(c.swatch).base }} />
                </span>
                <span className="text-right font-mono text-[13px] text-navy">{c.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface px-[26px] py-6" aria-labelledby="recent">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent" className="heading-card">
              Dernières mises à jour
            </h2>
            <Link to="/admin/medicaments" className="font-semibold text-bordeaux underline underline-offset-4">
              Tout voir
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-muted">Aucune fiche pour le moment.</p>
          ) : (
            <ul>
              {recent.map((m) => (
                <li key={m.id}>
                  <Link to={`/admin/medicaments/${m.id}`} className="flex items-center gap-3.5 rounded-lg border-b border-[#F1E7D3] px-1.5 py-2.5 hover:bg-sand-50">
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-xl text-lg font-extrabold text-white [font-stretch:70%]"
                      style={{ background: swatchAt(lookups.categories.get(m.categoryId)?.swatch).base }}
                    >
                      {m.name.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block font-semibold text-navy">{m.name}</strong>
                      <small className="text-[13px] text-muted">{formatLongDate(m.updatedAt)}</small>
                    </span>
                    <StatusBadge status={m.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
