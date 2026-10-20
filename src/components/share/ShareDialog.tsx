import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { formatLongDate } from '../../lib/date';
import { SHARE_DURATIONS, shareMailto, shareUrl, type ShareDuration, type ShareFormValues } from '../../lib/share';
import { swatchAt } from '../../lib/palette';
import { useCatalog } from '../../store/CatalogContext';
import { useToast } from '../../store/ToastContext';
import type { DoctorShare, FieldErrors } from '../../types/catalog';
import { Button, buttonClasses } from '../ui/Button';
import { SelectField, TextAreaField, TextField } from '../ui/Field';
import { Icon } from '../ui/Icon';
import { Segmented } from '../ui/Segmented';

const defaultMessage = (name: string) =>
  `Bonjour Docteur,\n\nVeuillez trouver ci-joint la fiche de présentation de ${name || 'notre spécialité'}, avec sa documentation et sa vidéo de présentation.\n\nNous restons à votre disposition pour toute question.`;

interface ShareDialogProps {
  open: boolean;
  medicineId?: string;
  onClose: () => void;
}

/** Création d'un lien de partage nominatif vers une fiche, pour un médecin. */
export function ShareDialog({ open, medicineId, onClose }: ShareDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="share-title"
      className="animate-pop m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[600px] overflow-y-auto rounded-[26px] bg-white p-0 shadow-[0_40px_80px_-30px_rgba(0,0,0,.5)] backdrop:bg-[rgba(0,26,40,.58)]"
    >
      {open && <ShareFlow key={medicineId ?? 'none'} medicineId={medicineId} onClose={onClose} />}
    </dialog>
  );
}

function ShareFlow({ medicineId, onClose }: { medicineId?: string; onClose: () => void }) {
  const { data, createShare } = useCatalog();
  const published = useMemo(() => data.medicines.filter((m) => m.status === 'published'), [data.medicines]);
  const initial = published.find((m) => m.id === medicineId);

  const [values, setValues] = useState<ShareFormValues>({
    medicineId: initial?.id ?? '',
    recipientName: '',
    recipientEmail: '',
    specialty: '',
    message: defaultMessage(initial?.name ?? ''),
    duration: 30,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof ShareFormValues>>({});
  const [created, setCreated] = useState<DoctorShare | null>(null);

  const set = <K extends keyof ShareFormValues>(key: K, value: ShareFormValues[K]) => {
    setValues((v) => {
      const next = { ...v, [key]: value };
      // Met à jour le nom du produit dans le message tant qu'il n'a pas été personnalisé.
      if (key === 'medicineId') {
        const prev = published.find((m) => m.id === v.medicineId)?.name ?? '';
        const nextName = published.find((m) => m.id === value)?.name ?? '';
        if (v.message === defaultMessage(prev)) next.message = defaultMessage(nextName);
      }
      return next;
    });
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function submit(e: FormEvent) {
    e.preventDefault();
    const result = createShare(values);
    if (!result.ok) return setErrors(result.errors);
    setCreated(result.share);
  }

  if (created) return <ShareResult share={created} onClose={onClose} />;

  return (
    <form noValidate onSubmit={submit}>
      <header className="flex items-start gap-4 border-b border-sand-200 px-7 pt-7 pb-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-navy text-cream">
          <Icon name="send" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="share-title" className="text-[26px] leading-tight font-bold text-navy [font-stretch:80%]">
            Partager à un médecin
          </h2>
          <p className="mt-1 text-[14.5px] text-ink-soft">Le médecin reçoit un lien personnel vers la fiche complète : informations, documents et vidéo.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer" className="-mt-1 -mr-2 grid size-11 place-items-center rounded-xl hover:bg-sand-100">
          <Icon name="close" />
        </button>
      </header>

      <div className="grid gap-[18px] px-7 py-6 sm:grid-cols-2">
        <SelectField
          className="sm:col-span-2"
          label="Médicament"
          required
          placeholder="Sélectionner une fiche publiée…"
          value={values.medicineId}
          error={errors.medicineId}
          onChange={(v) => set('medicineId', v)}
          options={published.map((m) => ({
            value: m.id,
            label: m.name,
            hint: `${m.activeSubstance} · ${m.strength} · ${m.dosageForm}`,
            swatch: swatchAt(data.categories.find((c) => c.id === m.categoryId)?.swatch).base,
          }))}
        />
        <TextField
          label="Nom du médecin"
          required
          placeholder="Ex. Dr Claire Morel"
          autoComplete="off"
          value={values.recipientName}
          error={errors.recipientName}
          onChange={(e) => set('recipientName', e.target.value)}
        />
        <TextField
          label="Spécialité"
          placeholder="Ex. Cardiologue"
          value={values.specialty}
          onChange={(e) => set('specialty', e.target.value)}
        />
        <TextField
          className="sm:col-span-2"
          label="E-mail du médecin"
          type="email"
          required
          autoComplete="off"
          value={values.recipientEmail}
          error={errors.recipientEmail}
          onChange={(e) => set('recipientEmail', e.target.value)}
        />
        <TextAreaField
          className="sm:col-span-2 [&_textarea]:min-h-[140px]"
          label="Message personnalisé"
          hint="Affiché en tête de la page consultée par le médecin. Aucune recommandation médicale."
          value={values.message}
          error={errors.message}
          onChange={(e) => set('message', e.target.value)}
        />
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-sm font-semibold text-navy">Validité du lien</p>
          <Segmented<string>
            label="Validité du lien"
            value={String(values.duration)}
            onChange={(v) => set('duration', Number(v) as ShareDuration)}
            options={SHARE_DURATIONS.map((d) => ({ value: String(d), label: `${d} jours` }))}
          />
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-end gap-2.5 border-t border-sand-200 bg-sand-50 px-7 py-4">
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" icon="link">
          Créer le lien de partage
        </Button>
      </footer>
    </form>
  );
}

function ShareResult({ share, onClose }: { share: DoctorShare; onClose: () => void }) {
  const { data } = useCatalog();
  const { notify } = useToast();
  const medicine = data.medicines.find((m) => m.id === share.medicineId);
  const url = shareUrl(share.token);
  const inputRef = useRef<HTMLInputElement>(null);
  const expiresLabel = formatLongDate(share.expiresAt);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      notify('Lien de partage copié.');
    } catch {
      inputRef.current?.select();
      notify('Copie automatique indisponible : le lien est sélectionné, utilisez Ctrl+C.', 'info');
    }
  }

  return (
    <div>
      <header className="px-7 pt-7">
        <span className="mb-4 grid size-12 place-items-center rounded-full bg-sky-50 text-navy">
          <Icon name="check" size={24} />
        </span>
        <h2 id="share-title" className="text-[26px] leading-tight font-bold text-navy [font-stretch:80%]">
          Lien prêt pour {share.recipientName}
        </h2>
        <p className="mt-1.5 text-[14.5px] text-ink-soft">
          Fiche <strong>{medicine?.name}</strong> · lien personnel valable jusqu’au <strong>{expiresLabel}</strong>.
        </p>
      </header>
      <div className="px-7 py-6">
        <label htmlFor="share-url" className="mb-1.5 block text-sm font-semibold text-navy">
          Lien de partage
        </label>
        <div className="flex gap-2">
          <input ref={inputRef} id="share-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="field-control min-w-0 font-mono text-[13.5px]" />
          <Button icon="copy" onClick={copy}>
            Copier
          </Button>
        </div>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <a
            className={buttonClasses('navy', 'md', true)}
            href={shareMailto({
              to: share.recipientEmail,
              recipientName: share.recipientName,
              medicineName: medicine?.name ?? '',
              companyName: data.settings.companyName,
              url,
              message: share.message,
              expiresLabel,
            })}
          >
            <Icon name="mail" size={18} />
            Envoyer par e-mail
          </a>
          <a className={buttonClasses('ghost', 'md', true)} href={url} target="_blank" rel="noopener noreferrer">
            <Icon name="eye" size={18} />
            Voir comme le médecin
          </a>
        </div>
        <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-[13.5px] leading-relaxed text-[#4A3A22]">
          « Envoyer par e-mail » ouvre votre messagerie avec un message prérempli.
          <br />
          <strong>Prototype :</strong> les données restant dans ce navigateur, le lien ne s’ouvre que sur ce poste. En production, il sera accessible au
          médecin depuis n’importe quel appareil.
        </p>
      </div>
      <footer className="flex justify-end border-t border-sand-200 bg-sand-50 px-7 py-4">
        <Button onClick={onClose}>Terminer</Button>
      </footer>
    </div>
  );
}
