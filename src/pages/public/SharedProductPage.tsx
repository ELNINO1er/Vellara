import { useEffect } from 'react';
import { Link, ScrollRestoration, useParams } from 'react-router';
import { Logo } from '../../components/brand/Logo';
import { ProductDetail } from '../../components/product/ProductDetail';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Feedback';
import { Icon } from '../../components/ui/Icon';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { DemoStrip } from '../../layouts/PublicLayout';
import { formatLongDate } from '../../lib/date';
import { shareStatus } from '../../lib/share';
import { useCatalog } from '../../store/CatalogContext';

/**
 * Page reçue par un médecin via un lien de partage nominatif.
 * Présentation épurée : message personnel, fiche complète, documents et vidéo.
 */
export function SharedProductPage() {
  const { token = '' } = useParams();
  const { data, recordShareView } = useCatalog();
  const share = data.shares.find((s) => s.token === token);
  const medicine = share ? data.medicines.find((m) => m.id === share.medicineId) : undefined;
  const status = share ? shareStatus(share) : null;
  const usable = share && status === 'active' && medicine?.status === 'published';

  useDocumentTitle(usable ? `${medicine.name} — pour ${share.recipientName}` : 'Lien de partage');

  // Une consultation comptée par onglet.
  useEffect(() => {
    if (!usable) return;
    const key = `vellara.share.viewed.${token}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* compte quand même */
    }
    recordShareView(token);
  }, [usable, token, recordShareView]);

  const { settings } = data;

  return (
    <div className="flex min-h-screen flex-col">
      <DemoStrip />
      <header className="border-b border-sand-200 bg-ivory">
        <div className="container-page flex min-h-[72px] flex-wrap items-center justify-between gap-3 py-2.5">
          <Logo name={settings.companyName} subtitle="Information professionnelle" />
          {usable && (
            <span className="inline-flex items-center gap-2 rounded-full bg-sand-100 px-3.5 py-2 text-[13.5px] text-ink-soft">
              <Icon name="lock" size={16} className="text-bordeaux" />
              Lien personnel · valable jusqu’au {formatLongDate(share.expiresAt)}
            </span>
          )}
        </div>
      </header>

      <main id="contenu" className="flex-1">
        {!usable ? (
          <div className="container-page py-20">
            <EmptyState
              tone="bordeaux"
              title={
                status === 'revoked'
                  ? 'Ce lien a été désactivé'
                  : status === 'expired'
                    ? 'Ce lien a expiré'
                    : 'Lien de partage introuvable'
              }
              action={<ButtonLink to="/contact">Contacter nos équipes</ButtonLink>}
            >
              {status === 'expired'
                ? `Il était valable jusqu’au ${formatLongDate(share!.expiresAt)}. Demandez un nouveau lien à votre interlocuteur.`
                : status === 'active'
                  ? 'Cette fiche n’est plus disponible pour le moment.'
                  : 'Vérifiez l’adresse reçue ou demandez un nouveau lien à votre interlocuteur.'}
            </EmptyState>
          </div>
        ) : (
          <>
            <section className="border-b border-sand-200 bg-navy text-[#DCE8F0]">
              <div className="container-page grid gap-6 py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-12 md:py-12">
                <div>
                  <p className="eyebrow text-sky-300">À l’attention de</p>
                  <h1 className="text-[clamp(34px,4vw,52px)] leading-[0.98] font-extrabold text-white [font-stretch:72%]">{share.recipientName}</h1>
                  {share.specialty && <p className="mt-2 text-[17px] text-sky-300">{share.specialty}</p>}
                  <p className="mt-5 text-[14.5px] text-[#B9CDDA]">
                    Transmis par {settings.companyName} le {formatLongDate(share.createdAt)}
                  </p>
                </div>
                {share.message && (
                  <blockquote className="relative rounded-3xl bg-white/6 px-6 py-5 text-[16.5px] leading-relaxed whitespace-pre-line text-[#E6EFF5] ring-1 ring-white/12">
                    <span aria-hidden="true" className="absolute -top-4 left-5 font-serif text-6xl leading-none text-ember">
                      “
                    </span>
                    {share.message}
                  </blockquote>
                )}
              </div>
            </section>
            <nav aria-label="Sommaire de la fiche" className="sticky top-0 z-20 border-b border-sand-200 bg-ivory/95 backdrop-blur-sm">
              <div className="container-page flex gap-1 overflow-x-auto py-2 text-sm font-semibold">
                {[
                  ['#fiche', 'Fiche produit'],
                  ['#medical-title', 'Informations médicales'],
                  ...(medicine.videoUrl ? [['#video', 'Vidéo'] as const] : []),
                  ...(medicine.leaflet || medicine.brochure ? [['#docs-title', 'Documents'] as const] : []),
                ].map(([href, label]) => (
                  <a key={href} href={href} className="inline-flex min-h-10 shrink-0 items-center rounded-full px-3.5 text-navy hover:bg-sand-100">
                    {label}
                  </a>
                ))}
              </div>
            </nav>
            <div id="fiche" className="scroll-mt-16 pt-10">
              <ProductDetail medicine={medicine} shared />
            </div>
          </>
        )}
      </main>

      <footer className="bg-navy-deep py-8 text-[13px] leading-relaxed text-[#9FB6C5]">
        <div className="container-page">
          Ce lien vous est personnellement destiné : merci de ne pas le transférer. Information destinée aux professionnels de santé, issue de la
          documentation validée de l’entreprise ; elle ne constitue pas une recommandation médicale. Prototype : produits fictifs.{' '}
          <Link to="/" className="text-[#DCE8F0] underline">
            Accéder au catalogue
          </Link>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
