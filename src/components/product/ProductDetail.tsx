import { useState } from 'react';
import { isMedicalPlaceholder, shareLink } from '../../lib/catalog';
import { useCatalog } from '../../store/CatalogContext';
import { useToast } from '../../store/ToastContext';
import type { DocumentSource, Medicine } from '../../types/catalog';
import { Button, ButtonLink } from '../ui/Button';
import { Notice } from '../ui/Feedback';
import { Icon } from '../ui/Icon';
import { ProductMedia } from './ProductVisual';
import { useMedicineMeta } from './useMedicineMeta';
import { VideoPlayer } from './VideoPlayer';

interface ProductDetailProps {
  medicine: Medicine;
  /** En aperçu : pas de lien de partage ni de demande d'informations. */
  preview?: boolean;
  /** Consultée via un partage nominatif : pas de copie du lien public. */
  shared?: boolean;
}

/** Fiche détaillée, partagée entre la page publique et l'aperçu d'administration. */
export function ProductDetail({ medicine: m, preview = false, shared = false }: ProductDetailProps) {
  const meta = useMedicineMeta(m);
  const { data } = useCatalog();
  const { notify } = useToast();
  const images = [m.image, ...m.gallery].filter((u): u is string => !!u);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const visible = images.filter((u) => !failed.has(u));
  const current = visible[Math.min(active, Math.max(visible.length - 1, 0))] ?? null;
  const [manualLink, setManualLink] = useState<string | null>(null);

  const link = shareLink(data.settings.publicBaseUrl, m);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setManualLink(null);
      notify('Lien de la fiche copié dans le presse-papiers.');
    } catch {
      setManualLink(link);
    }
  }

  const facts: [string, string, boolean?][] = [
    ['Substance active (DCI)', m.activeSubstance || '—'],
    ['Laboratoire', meta.laboratoryName],
    ['Dosage', m.strength || '—', true],
    ['Forme pharmaceutique', m.dosageForm || '—'],
    ['Conditionnement', m.packaging || 'À préciser'],
    ['Mise à jour', meta.updatedLong],
  ];

  const sections = [
    ['Indications', m.medical.indications],
    ['Contre-indications', m.medical.contraindications],
    ['Précautions d’emploi', m.medical.precautions],
    ['Effets indésirables', m.medical.adverseEffects],
  ] as const;

  const documents = [
    ['Notice', m.leaflet],
    ['Brochure', m.brochure],
  ].filter((d): d is [string, DocumentSource] => !!d[1]);

  return (
    <>
      <div className="container-page grid items-start gap-8 pb-16 md:grid-cols-2 md:gap-16">
        {/* Visuels */}
        <div>
          <div className="relative aspect-[1/0.9] overflow-hidden rounded-[28px] [&_[aria-hidden]]:-rotate-3">
            <ProductMedia
              image={current}
              alt={`Visuel de ${m.name}`}
              fit="contain"
              padding="px-[18%]"
              name={m.name}
              substance={m.activeSubstance}
              strength={m.strength}
              laboratory={meta.laboratoryShort}
              swatch={meta.swatch}
            />
            <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.12em] text-muted uppercase">
              Produit fictif
            </span>
            {/* Détection des images cassées de la galerie */}
            {visible.map((u) => (
              <img key={u} src={u} alt="" hidden onError={() => setFailed((s) => new Set(s).add(u))} />
            ))}
          </div>
          {visible.length > 1 && (
            <div role="group" aria-label="Images du produit" className="mt-3.5 flex flex-wrap gap-2.5">
              {visible.map((u, i) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={u === current}
                  aria-label={`Afficher l’image ${i + 1} sur ${visible.length}`}
                  onClick={() => setActive(i)}
                  className="size-[76px] overflow-hidden rounded-[14px] border-2 border-sand-200 bg-white aria-pressed:border-bordeaux"
                >
                  <img src={u} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {visible.length === 0 && <p className="mt-2 text-[13.5px] text-muted">Aucune photo disponible : visuel généré à partir de la fiche.</p>}
        </div>

        {/* Informations */}
        <div>
          <p className="eyebrow" style={{ color: meta.swatch.ink }}>
            {meta.categoryName}
          </p>
          <h1 className="mt-0.5 mb-3 text-[clamp(50px,5.6vw,80px)] leading-[0.92] font-extrabold tracking-[-0.02em] [overflow-wrap:anywhere] text-navy [font-stretch:68%]">
            {m.name || 'Nom commercial'}
          </h1>
          <p className="text-[21px] text-ink-soft">{m.activeSubstance}</p>
          <div className="mt-[18px] flex flex-wrap gap-2">
            <span className="chip font-mono">{m.strength}</span>
            <span className="chip">{m.dosageForm}</span>
            {meta.video && (
              <span className="chip bg-navy text-white">
                <Icon name="play" size={14} />
                Vidéo disponible
              </span>
            )}
          </div>
          <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-ink">{m.description}</p>

          <dl className="my-7 grid gap-x-6 border-t border-sand-200 sm:grid-cols-2">
            {facts.map(([label, value, mono]) => (
              <div key={label} className="min-w-0 border-b border-sand-200 py-3.5">
                <dt className="text-[11.5px] font-semibold tracking-[0.13em] text-muted uppercase">{label}</dt>
                <dd className={`mt-1 font-semibold [overflow-wrap:anywhere] text-navy ${mono ? 'font-mono' : ''}`}>{value}</dd>
              </div>
            ))}
          </dl>

          {!preview && (
            <div className="flex flex-wrap gap-2.5">
              {!shared && (
                <Button icon="link" onClick={copyLink}>
                  Copier le lien de la fiche
                </Button>
              )}
              <ButtonLink variant={shared ? 'primary' : 'ghost'} to={`/contact?produit=${encodeURIComponent(m.id)}`}>
                Demander des informations
              </ButtonLink>
              {meta.video && (
                <a href="#video" className="inline-flex min-h-11 items-center px-3 font-semibold text-navy underline underline-offset-4 hover:text-bordeaux">
                  Voir la vidéo
                </a>
              )}
            </div>
          )}
          {manualLink && (
            <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-sand-300 bg-white p-4">
              <label htmlFor="share-link" className="text-[13.5px] text-ink-soft">
                Copie automatique indisponible : sélectionnez le lien puis copiez-le.
              </label>
              <input id="share-link" readOnly value={manualLink} onFocus={(e) => e.currentTarget.select()} autoFocus className="field-control font-mono text-sm" />
            </div>
          )}
        </div>
      </div>

      {/* Informations médicales */}
      <section className="border-t border-sand-200 bg-sand-50 py-16 md:py-[72px]" aria-labelledby="medical-title">
        <div className="container-page">
          <p className="eyebrow">Informations médicales</p>
          <h2 id="medical-title" className="heading-section mb-7">
            Données issues de la documentation validée
          </h2>
          <div className="mb-6">
            <Notice>
              Ces rubriques sont alimentées uniquement à partir des documents validés de l’entreprise et ne constituent pas une recommandation médicale.
              Source : <strong>{m.source || 'à renseigner'}</strong>.
            </Notice>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {sections.map(([title, text]) => {
              const empty = isMedicalPlaceholder(text);
              return (
                <article key={title} className="surface px-[26px] py-6">
                  <h3 className="heading-card mb-3 flex items-center justify-between gap-2.5">
                    {title}
                    {empty && (
                      <span className="rounded-full bg-cream px-2.5 py-1 font-sans text-[10.5px] font-bold tracking-[0.12em] whitespace-nowrap text-bordeaux uppercase [font-stretch:100%]">
                        À compléter
                      </span>
                    )}
                  </h3>
                  <p className={`whitespace-pre-line ${empty ? 'text-muted italic' : 'text-ink'}`}>{text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vidéo : section entièrement masquée sans lien */}
      {meta.video && (
        <section id="video" className="scroll-mt-24 border-t border-sand-200 py-16 md:py-[72px]" aria-labelledby="video-title">
          <div className="container-page grid items-center gap-12 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.6fr)]">
            <div>
              <p className="eyebrow">Présentation vidéo</p>
              <h2 id="video-title" className="heading-section">
                Découvrir {m.name} en vidéo
              </h2>
              <p className="mt-4 text-[17px] text-ink-soft">Présentation fournie par l’entreprise. Hébergement : {meta.video.provider}.</p>
              <a
                href={meta.video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 font-semibold text-bordeaux underline underline-offset-4 hover:text-ember"
              >
                <Icon name="external" size={18} />
                Ouvrir le lien d’origine<span className="sr-only"> (nouvel onglet)</span>
              </a>
            </div>
            <VideoPlayer video={meta.video} title={m.name} />
          </div>
        </section>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <section className="border-t border-sand-200 py-16 md:py-[72px]" aria-labelledby="docs-title">
          <div className="container-page">
            <p className="eyebrow">Documents</p>
            <h2 id="docs-title" className="heading-section mb-7">
              Notice et brochure
            </h2>
            <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
              {documents.map(([label, doc]) => (
                <DocumentTile key={label} label={label} doc={doc} onDemo={() => notify('Document de démonstration : aucun fichier réel n’est associé à ce produit fictif.', 'info')} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-sand-200 py-12">
        <dl className="container-page">
          <div className="surface flex flex-wrap gap-x-10 gap-y-4 px-[26px] py-[22px]">
            {[
              ['Source documentaire', m.source || 'À renseigner'],
              ['Dernière mise à jour', meta.updatedLong],
              ['Statut', 'Donnée de démonstration — produit fictif'],
            ].map(([dt, dd]) => (
              <div key={dt} className="min-w-0">
                <dt className="text-[11.5px] font-semibold tracking-[0.13em] text-muted uppercase">{dt}</dt>
                <dd className="mt-1 font-semibold text-navy">{dd}</dd>
              </div>
            ))}
          </div>
        </dl>
      </section>
    </>
  );
}

function DocumentTile({ label, doc, onDemo }: { label: string; doc: DocumentSource; onDemo: () => void }) {
  const tile =
    'flex w-full items-center gap-4 rounded-[18px] border border-sand-200 bg-white px-[18px] py-4 text-left text-ink transition-[border-color,transform] hover:-translate-y-0.5 hover:border-bordeaux';
  const body = (
    <>
      <span className="grid h-14 w-[46px] shrink-0 place-items-center rounded-[8px_14px_8px_8px] bg-danger-50 font-mono text-[11px] font-semibold text-ember-ink">PDF</span>
      <span className="min-w-0">
        <span className="block font-semibold text-navy">{label}</span>
        <span className="block truncate text-[13.5px] text-muted">
          {doc.name} · {doc.type === 'url' ? 'nouvel onglet' : doc.type === 'file' ? 'téléchargement' : 'fichier de démonstration'}
        </span>
      </span>
      <Icon name={doc.type === 'url' ? 'external' : 'download'} className="ml-auto text-bordeaux" />
    </>
  );
  if (doc.type === 'url')
    return (
      <a className={tile} href={doc.url} target="_blank" rel="noopener noreferrer">
        {body}
      </a>
    );
  if (doc.type === 'file')
    return (
      <a className={tile} href={doc.dataUrl} download={doc.name}>
        {body}
      </a>
    );
  return (
    <button type="button" className={tile} onClick={onDemo}>
      {body}
    </button>
  );
}
