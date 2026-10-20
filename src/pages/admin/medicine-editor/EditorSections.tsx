import type { ReactNode } from 'react';
import { GeneratedPack } from '../../../components/product/ProductVisual';
import { Button } from '../../../components/ui/Button';
import { Notice } from '../../../components/ui/Feedback';
import { CheckboxField, SelectField, TextAreaField, TextField } from '../../../components/ui/Field';
import { Icon } from '../../../components/ui/Icon';
import { DOSAGE_FORMS, MEDICAL_PLACEHOLDER } from '../../../config/brand';
import { formatBytes, readImage, readPdf } from '../../../lib/files';
import { swatchAt } from '../../../lib/palette';
import { describeVideoKind, parseVideoUrl } from '../../../lib/video';
import { isHttpUrl } from '../../../lib/validation';
import { useCatalog } from '../../../store/CatalogContext';
import { useToast } from '../../../store/ToastContext';
import type { DocumentKind, useMedicineDraft } from './useMedicineDraft';

export type DraftApi = ReturnType<typeof useMedicineDraft>;

function Section({ index, title, optional, children }: { index: number; title: string; optional?: boolean; children: ReactNode }) {
  const id = `section-${index}`;
  return (
    <section aria-labelledby={id} className="surface min-w-0 p-5 sm:p-[26px]">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-full bg-cream px-2.5 py-[3px] font-mono text-xs font-semibold text-bordeaux">{String(index).padStart(2, '0')}</span>
        <h2 id={id} className="text-[23px] leading-[1.1] font-bold text-navy [font-stretch:80%]">
          {title}
        </h2>
        {optional && <span className="ml-auto text-[13px] text-muted">Facultatif</span>}
      </div>
      {children}
    </section>
  );
}

const grid = 'grid gap-x-5 gap-y-[18px] sm:grid-cols-2';

export function IdentificationSection({ form }: { form: DraftApi }) {
  const { data } = useCatalog();
  const v = form.draft.values;
  return (
    <Section index={1} title="Identification">
      <div className={grid}>
        <TextField label="Nom commercial" required value={v.name} error={form.errors.name} placeholder="Ex. Cardivel" onChange={(e) => form.setValue('name', e.target.value)} />
        <TextField
          label="Substance active (DCI)"
          required
          value={v.activeSubstance}
          error={form.errors.activeSubstance}
          onChange={(e) => form.setValue('activeSubstance', e.target.value)}
        />
        <SelectField
          label="Laboratoire"
          required
          placeholder="Sélectionner…"
          options={data.laboratories.map((l) => ({ value: l.id, label: l.name }))}
          value={v.laboratoryId}
          error={form.errors.laboratoryId}
          onChange={(v) => form.setValue('laboratoryId', v)}
        />
        <SelectField
          label="Catégorie thérapeutique"
          required
          placeholder="Sélectionner…"
          options={data.categories.map((c) => ({ value: c.id, label: c.name, swatch: swatchAt(c.swatch).base }))}
          value={v.categoryId}
          error={form.errors.categoryId}
          onChange={(v) => form.setValue('categoryId', v)}
        />
      </div>
    </Section>
  );
}

export function PresentationSection({ form }: { form: DraftApi }) {
  const v = form.draft.values;
  const forms: string[] = [...DOSAGE_FORMS];
  if (v.dosageForm && !forms.includes(v.dosageForm)) forms.push(v.dosageForm);
  return (
    <Section index={2} title="Présentation">
      <div className={grid}>
        <TextField label="Dosage" required value={v.strength} error={form.errors.strength} placeholder="Ex. 10 mg" className="[&_input]:font-mono" onChange={(e) => form.setValue('strength', e.target.value)} />
        <SelectField
          label="Forme pharmaceutique"
          required
          placeholder="Sélectionner…"
          options={forms.map((f) => ({ value: f, label: f }))}
          value={v.dosageForm}
          error={form.errors.dosageForm}
          onChange={(v) => form.setValue('dosageForm', v)}
        />
        <TextField
          className="sm:col-span-2"
          label="Conditionnement"
          required
          value={v.packaging}
          error={form.errors.packaging}
          placeholder="Ex. Boîte de 30 comprimés"
          onChange={(e) => form.setValue('packaging', e.target.value)}
        />
        <TextAreaField
          className="sm:col-span-2"
          label="Description"
          required
          value={v.description}
          error={form.errors.description}
          hint="Présentation commerciale neutre, sans allégation d’efficacité ni recommandation médicale."
          onChange={(e) => form.setValue('description', e.target.value)}
        />
        <CheckboxField
          className="sm:col-span-2"
          label="Mettre en avant sur la page d’accueil"
          checked={v.featured}
          onChange={(e) => form.setValue('featured', e.target.checked)}
        />
      </div>
    </Section>
  );
}

export function VisualsSection({ form }: { form: DraftApi }) {
  const { lookups } = useCatalog();
  const { notify } = useToast();
  const v = form.draft.values;
  const swatch = swatchAt(lookups.categories.get(v.categoryId)?.swatch);
  const isUpload = v.image.startsWith('data:');

  async function onFile(file: File | undefined) {
    if (!file) return;
    const result = await readImage(file);
    if (!result.ok) {
      form.setErrors((e) => ({ ...e, image: result.error }));
      notify(result.error, 'error');
      return;
    }
    form.setValue('image', result.dataUrl);
    notify(`Image « ${result.name} » importée.`);
  }

  return (
    <Section index={3} title="Visuels" optional>
      <div className="flex flex-wrap items-center gap-[18px]">
        <div className="relative grid h-[110px] w-[132px] shrink-0 place-items-center overflow-hidden rounded-2xl px-3.5" style={{ background: swatch.tint }}>
          {v.image && (isUpload || isHttpUrl(v.image)) ? (
            <img src={v.image} alt="Aperçu de la photo principale" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <GeneratedPack name={v.name} strength={v.strength} swatch={swatch} />
          )}
        </div>
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2.5">
          <span className="text-sm font-semibold text-navy">Photo principale</span>
          <div className="flex flex-wrap items-center gap-2.5">
            <FileButton accept="image/*" label="Importer une image" onFile={onFile} />
            {v.image && (
              <Button variant="quiet" onClick={() => form.setValue('image', '')}>
                Retirer
              </Button>
            )}
          </div>
          <p className="text-[13px] text-muted">JPG, PNG ou WebP, 900 Ko maximum. Sans photo, un visuel est généré à partir de la fiche.</p>
        </div>
      </div>
      <div className={`${grid} mt-[18px]`}>
        <TextField
          className="sm:col-span-2"
          label="Ou adresse de l’image"
          value={isUpload ? '' : v.image}
          placeholder={isUpload ? 'Image importée depuis votre poste' : 'https://…'}
          error={form.errors.image}
          onChange={(e) => form.setValue('image', e.target.value)}
        />
        <TextAreaField
          className="sm:col-span-2 [&_textarea]:min-h-[84px]"
          label="Images complémentaires"
          value={v.galleryText}
          error={form.errors.galleryText}
          placeholder="Une adresse https://… par ligne"
          hint="Une adresse par ligne. Les images indisponibles sont masquées automatiquement sur la fiche."
          onChange={(e) => form.setValue('galleryText', e.target.value)}
        />
      </div>
    </Section>
  );
}

export function MedicalSection({ form }: { form: DraftApi }) {
  const v = form.draft.values;
  const fields = [
    ['indications', 'Indications'],
    ['contraindications', 'Contre-indications'],
    ['precautions', 'Précautions d’emploi'],
    ['adverseEffects', 'Effets indésirables'],
  ] as const;
  return (
    <Section index={4} title="Informations médicales">
      <div className="mb-[18px]">
        <Notice>
          Ne saisir ici que des contenus repris des documents validés de l’entreprise. Laissez la mention « {MEDICAL_PLACEHOLDER} » tant que la
          rubrique n’est pas renseignée.
        </Notice>
      </div>
      <div className="grid gap-[18px]">
        {fields.map(([key, label]) => (
          <TextAreaField key={key} label={label} value={v[key]} onChange={(e) => form.setValue(key, e.target.value)} />
        ))}
      </div>
    </Section>
  );
}

export function DocumentsSection({ form }: { form: DraftApi }) {
  return (
    <Section index={5} title="Documents" optional>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DocumentInput form={form} kind="leaflet" label="Notice (PDF)" />
        <DocumentInput form={form} kind="brochure" label="Brochure (PDF)" />
      </div>
      <p className="mt-3 text-[13px] text-muted">PDF de 1,2 Mo maximum en démonstration (stockage local du navigateur).</p>
    </Section>
  );
}

function DocumentInput({ form, kind, label }: { form: DraftApi; kind: DocumentKind; label: string }) {
  const { notify } = useToast();
  const file = form.draft[`${kind}File`];
  const urlField = kind === 'leaflet' ? 'leafletUrl' : 'brochureUrl';

  async function onFile(f: File | undefined) {
    if (!f) return;
    const result = await readPdf(f);
    if (!result.ok) {
      form.setErrors((e) => ({ ...e, [urlField]: result.error }));
      notify(result.error, 'error');
      return;
    }
    form.setDocument(kind, { type: 'file', name: result.name, dataUrl: result.dataUrl, size: result.size });
    notify(`Document « ${result.name} » importé.`);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-2xl border border-dashed border-sand-300 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <strong className="text-navy">{label}</strong>
        <FileButton accept="application/pdf" label="Importer" onFile={onFile} />
      </div>
      {file && (
        <div className="flex items-center gap-2.5 rounded-xl bg-sand-50 py-2 pr-2 pl-3.5 text-sm">
          <span className="grid h-9 w-[30px] shrink-0 place-items-center rounded-md bg-danger-50 font-mono text-[9px] font-semibold text-ember-ink">PDF</span>
          <span className="min-w-0 flex-1 truncate">
            {file.name}
            {file.type === 'file' && <span className="text-muted"> · {formatBytes(file.size)}</span>}
            {file.type === 'demo' && <span className="text-muted"> · démonstration</span>}
          </span>
          <button
            type="button"
            onClick={() => form.setDocument(kind, null)}
            aria-label={`Retirer ${label.toLowerCase()}`}
            className="grid size-11 place-items-center rounded-xl hover:bg-danger-50 hover:text-ember-ink"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
      <TextField
        label={`Ou lien vers ${kind === 'leaflet' ? 'la notice' : 'la brochure'}`}
        value={form.draft.values[urlField]}
        placeholder="https://…"
        error={form.errors[urlField]}
        onChange={(e) => form.setDocumentUrl(kind, e.target.value)}
      />
    </div>
  );
}

export function VideoSection({ form }: { form: DraftApi }) {
  const v = form.draft.values;
  const info = isHttpUrl(v.videoUrl.trim()) ? parseVideoUrl(v.videoUrl) : null;
  const note = info
    ? info.kind === 'embed'
      ? 'affichage dans un lecteur intégré sur la fiche.'
      : info.kind === 'file'
        ? 'lecture directe du fichier sur la fiche.'
        : 'la fiche proposera un bouton ouvrant ce lien.'
    : '';
  return (
    <Section index={6} title="Vidéo de présentation" optional>
      <TextField
        label="Lien de la vidéo"
        value={v.videoUrl}
        error={form.errors.videoUrl}
        placeholder="https://www.youtube.com/watch?v=… ou https://vimeo.com/…"
        hint="YouTube, Vimeo, Dailymotion ou fichier vidéo direct (.mp4, .webm). Sans lien, la section vidéo est masquée sur la fiche."
        onChange={(e) => form.setValue('videoUrl', e.target.value)}
      />
      {info && (
        <div role="status" className="mt-2.5 flex items-center gap-3 rounded-[14px] bg-sky-50 px-3.5 py-3 text-sm text-[#0B2A3D]">
          <Icon name="film" className="text-navy" />
          <span>
            <strong>{info.provider}</strong> détecté ({describeVideoKind(info.kind).toLowerCase()}) — {note}
          </span>
        </div>
      )}
    </Section>
  );
}

export function SourceSection({ form }: { form: DraftApi }) {
  return (
    <Section index={7} title="Source documentaire">
      <TextField
        label="Source des informations"
        required
        value={form.draft.values.source}
        error={form.errors.source}
        placeholder="Ex. RCP validé — réf. interne, version, date"
        hint="La date de mise à jour est enregistrée automatiquement à chaque sauvegarde."
        onChange={(e) => form.setValue('source', e.target.value)}
      />
    </Section>
  );
}

/** Bouton d'import de fichier accessible (le vrai <input> reste focalisable). */
function FileButton({ accept, label, onFile }: { accept: string; label: string; onFile: (file: File | undefined) => void }) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-sand-300 px-[18px] text-[15px] font-semibold text-navy transition-colors focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-sky hover:border-navy hover:bg-white">
      <Icon name="upload" size={18} />
      {label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </label>
  );
}

