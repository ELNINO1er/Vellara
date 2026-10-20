import { Link } from 'react-router';
import { Capsule } from '../../components/brand/Capsule';
import { ProductCard } from '../../components/product/ProductCard';
import { GeneratedPack } from '../../components/product/ProductVisual';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Feedback';
import { Icon } from '../../components/ui/Icon';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { hasVideo, isPublished, laboratoryName } from '../../lib/catalog';
import { swatchAt } from '../../lib/palette';
import { plural } from '../../lib/text';
import { useCatalog } from '../../store/CatalogContext';

const PACK_POSITIONS = [
  'left-[7%] top-[12%] -rotate-[5deg] z-[1]',
  'left-[41%] top-[30%] rotate-[4deg] z-[2]',
  'left-[16%] top-[52%] -rotate-[1.5deg] z-[3]',
];

export function HomePage() {
  useDocumentTitle('');
  const { data, lookups } = useCatalog();
  const published = data.medicines.filter(isPublished);
  const featured = [...published.filter((m) => m.featured), ...published.filter((m) => !m.featured)].slice(0, 4);

  const stats = [
    { value: published.length, label: 'spécialités publiées' },
    { value: data.categories.filter((c) => published.some((m) => m.categoryId === c.id)).length, label: 'aires thérapeutiques' },
    { value: new Set(published.map((m) => m.laboratoryId)).size, label: 'laboratoires' },
    { value: published.filter(hasVideo).length, label: 'présentations vidéo' },
  ];

  return (
    <>
      {/* Accroche */}
      <section className="overflow-hidden border-b border-sand-200 pt-12 pb-14 md:pt-[72px] md:pb-[76px]">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,.92fr)] lg:gap-16">
          <div>
            <p className="eyebrow">Espace professionnels de santé</p>
            <h1 className="display">
              Nos spécialités, <em className="text-bordeaux not-italic">présentées avec rigueur</em> aux professionnels de santé.
            </h1>
            <p className="mt-6 max-w-[54ch] text-[19px] leading-relaxed text-ink-soft">{data.settings.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/catalogue" size="lg" iconRight="arrowRight">
                Explorer le catalogue
              </ButtonLink>
              <ButtonLink to="/contact" size="lg" variant="ghost">
                Contacter nos équipes
              </ButtonLink>
            </div>
            <dl className="mt-12 grid grid-cols-2 border-t border-[#E2D2B0] sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse gap-1.5 pt-[18px] pr-3.5">
                  <dt className="text-[13px] leading-tight text-muted">{s.label}</dt>
                  <dd className="text-[44px] leading-none font-extrabold text-bordeaux [font-stretch:72%]">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div aria-hidden="true" className="group relative aspect-[1/1.04] overflow-hidden rounded-[32px] bg-cream">
            <span className="absolute -right-[12%] -bottom-[30%] aspect-square w-[70%] rounded-full bg-[#F6E2BB]" />
            <Capsule className="absolute bottom-[8%] -left-[6%] h-[17%] w-[62%] shadow-[0_20px_40px_-24px_rgba(120,0,0,.6)]" angle={-26} />
            <Capsule left="#003049" right="#669BBC" className="absolute top-[6%] right-[6%] h-[9%] w-[30%]" angle={32} />
            {featured.slice(0, 3).map((m, i) => (
              <div key={m.id} className={`absolute w-[52%] transition-transform duration-500 group-hover:-translate-y-1.5 ${PACK_POSITIONS[i]}`}>
                <GeneratedPack
                  name={m.name}
                  substance={m.activeSubstance}
                  strength={m.strength}
                  laboratory={laboratoryName(m, lookups).replace(/^Laboratoires?\s+/i, '')}
                  swatch={swatchAt(lookups.categories.get(m.categoryId)?.swatch)}
                />
              </div>
            ))}
            <span className="absolute right-[18px] bottom-[18px] z-[4] rounded-full bg-navy px-3 py-[7px] text-[11px] font-semibold tracking-[0.14em] text-cream uppercase">
              Produits fictifs
            </span>
          </div>
        </div>
      </section>

      {/* Aires thérapeutiques */}
      <section className="py-16 md:py-[84px]">
        <div className="container-page">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Aires thérapeutiques</p>
              <h2 className="heading-section">Parcourir par spécialité</h2>
            </div>
            <Link to="/catalogue" className="inline-flex items-center gap-1.5 py-1.5 font-semibold text-bordeaux underline underline-offset-4 hover:text-ember">
              Tout le catalogue <Icon name="arrowRight" size={18} />
            </Link>
          </div>
          <ul className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
            {data.categories.map((c) => {
              const sw = swatchAt(c.swatch);
              const count = published.filter((m) => m.categoryId === c.id).length;
              return (
                <li key={c.id}>
                  <Link
                    to={`/catalogue?categorie=${encodeURIComponent(c.id)}`}
                    className="flex min-h-[150px] flex-col gap-7 rounded-[20px] border border-sand-200 bg-white px-5 pt-[22px] pb-5 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-[3px] hover:border-sand-300 hover:shadow-[0_18px_36px_-28px_rgba(0,48,73,.55)]"
                  >
                    <Capsule left={sw.base} right={sw.tint} className="mt-2 h-[18px] w-[46px] origin-left" />
                    <span>
                      <span className="block text-[22px] leading-[1.1] font-bold text-navy [font-stretch:80%]">{c.name}</span>
                      <span className="mt-1.5 flex items-center justify-between text-[13.5px] text-muted">
                        {plural(count, 'spécialité', 'spécialités')}
                        <Icon name="arrowRight" size={18} style={{ color: sw.ink }} />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Sélection */}
      <section className="pb-16 md:pb-[84px]">
        <div className="container-page">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Sélection</p>
              <h2 className="heading-section">Spécialités à la une</h2>
              <p className="mt-3 max-w-[46ch] text-muted">
                Chaque fiche réunit sa documentation et, lorsqu’elle existe, une présentation vidéo.
              </p>
            </div>
            <ButtonLink to="/catalogue" variant="ghost">
              Voir les {published.length} spécialités
            </ButtonLink>
          </div>
          {featured.length ? (
            <div className="grid gap-[22px] [grid-template-columns:repeat(auto-fill,minmax(236px,1fr))]">
              {featured.map((m) => (
                <ProductCard key={m.id} medicine={m} />
              ))}
            </div>
          ) : (
            <EmptyState title="Aucune fiche publiée pour le moment" tone="bordeaux">
              Les spécialités apparaîtront ici dès leur publication depuis l’administration.
            </EmptyState>
          )}
        </div>
      </section>

      {/* Engagement documentaire */}
      <section className="bg-navy py-16 text-[#DCE8F0] md:py-[84px]">
        <div className="container-page">
          <p className="eyebrow text-sky-300">Notre engagement documentaire</p>
          <h2 className="heading-section max-w-[20ch] text-white">Une information produit fondée exclusivement sur des documents validés.</h2>
          <div className="mt-11 grid gap-6 md:grid-cols-3 md:gap-10">
            {[
              ['Contenus sourcés', 'Chaque rubrique médicale est alimentée uniquement à partir de la documentation validée par l’entreprise, avec sa source affichée.'],
              ['Mises à jour datées', 'La date de dernière mise à jour figure sur chaque fiche, pour savoir immédiatement si l’information est récente.'],
              ['Documents à portée de main', 'Notices, brochures et présentations vidéo sont rattachées directement à la fiche du produit concerné.'],
            ].map(([title, text], i) => (
              <div key={title} className="border-t border-white/18 pt-[22px]">
                <span className="mb-3.5 block font-mono text-[13px] text-sky-300">0{i + 1}</span>
                <h3 className="mb-2.5 text-2xl leading-tight font-bold text-cream [font-stretch:82%]">{title}</h3>
                <p className="text-[15.5px] text-[#C6D8E4]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="py-16 md:py-[76px]">
        <div className="container-page">
          <div className="flex flex-wrap items-center justify-between gap-8 rounded-[32px] bg-cream px-6 py-8 sm:px-14 sm:py-14">
            <div>
              <p className="eyebrow">Professionnels de santé</p>
              <h2 className="heading-section max-w-[18ch]">Une question sur l’une de nos spécialités ?</h2>
              <p className="mt-3 max-w-[52ch] text-[#4A3A22]">Nos équipes reviennent vers vous avec la documentation adaptée à votre demande.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to="/contact" size="lg">
                Nous contacter
              </ButtonLink>
              <ButtonLink to="/catalogue" size="lg" variant="ghost">
                Consulter le catalogue
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
