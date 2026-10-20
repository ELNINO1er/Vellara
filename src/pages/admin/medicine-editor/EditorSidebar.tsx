import { Button, ButtonLink } from '../../../components/ui/Button';
import { StatusBadge } from '../../../components/ui/Feedback';
import { Icon } from '../../../components/ui/Icon';
import { isMedicalPlaceholder } from '../../../lib/catalog';
import { formatLongDate } from '../../../lib/date';
import type { Medicine } from '../../../types/catalog';
import type { DraftApi } from './EditorSections';

interface Props {
  form: DraftApi;
  existing: Medicine | undefined;
  onSaveDraft: () => void;
  onPreview: () => void;
  onDelete: () => void;
  onShare: () => void;
}

/** Panneau latéral : statut, actions de publication et contrôle de complétude. */
export function EditorSidebar({ form, existing, onSaveDraft, onPreview, onDelete, onShare }: Props) {
  const v = form.draft.values;
  const published = existing?.status === 'published';
  const hasDoc = !!(v.leafletUrl || v.brochureUrl || form.draft.leafletFile || form.draft.brochureFile);

  const checks = [
    { label: 'Identification', ok: !!(v.name.trim() && v.activeSubstance.trim() && v.laboratoryId && v.categoryId) },
    { label: 'Présentation', ok: !!(v.strength.trim() && v.dosageForm && v.packaging.trim() && v.description.trim().length >= 20) },
    { label: 'Visuel principal', ok: !!v.image, optional: true },
    { label: 'Informations médicales', ok: ![v.indications, v.contraindications, v.precautions, v.adverseEffects].some(isMedicalPlaceholder), optional: true },
    { label: 'Documents', ok: hasDoc, optional: true },
    { label: 'Vidéo', ok: !!v.videoUrl.trim(), optional: true },
    { label: 'Source documentaire', ok: !!v.source.trim() },
  ];

  return (
    <aside aria-label="Publication" className="flex flex-[1_1_290px] flex-col gap-4 lg:sticky lg:top-4">
      <div className="surface p-[22px]">
        <h2 className="mb-3 text-xs font-semibold tracking-[0.15em] text-muted uppercase">Statut</h2>
        <StatusBadge status={existing?.status ?? 'new'} />
        <p className="mt-2 text-[13.5px] text-muted">Dernière mise à jour : {existing ? formatLongDate(existing.updatedAt) : '—'}</p>
        {form.dirty && (
          <p className="mt-2.5 flex items-center gap-2 text-[13px] text-[#6E3300]">
            <span className="size-2 rounded-full bg-ember" aria-hidden="true" />
            Modifications non enregistrées
          </p>
        )}
        <div className="mt-[18px] flex flex-col gap-2.5">
          <Button type="submit" block>
            {published ? 'Mettre à jour la publication' : 'Publier la fiche'}
          </Button>
          <Button variant="ghost" block onClick={onSaveDraft}>
            {published ? 'Repasser en brouillon' : 'Enregistrer le brouillon'}
          </Button>
          <Button variant="quiet" block icon="eye" onClick={onPreview}>
            Prévisualiser la fiche
          </Button>
          {published && existing && (
            <Button variant="navy" block icon="send" onClick={onShare}>
              Partager à un médecin
            </Button>
          )}
          {published && existing && (
            <ButtonLink variant="quiet" block icon="external" to={`/catalogue/${existing.slug}`}>
              Voir dans le catalogue
            </ButtonLink>
          )}
        </div>
      </div>

      <div className="surface p-[22px]">
        <h2 className="mb-3 text-xs font-semibold tracking-[0.15em] text-muted uppercase">Complétude</h2>
        <ul>
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2.5 border-b border-[#F3EADA] py-2 text-[14.5px] last:border-0">
              <span
                aria-hidden="true"
                className={`grid size-[22px] shrink-0 place-items-center rounded-full ${
                  c.ok ? 'bg-navy text-white' : c.optional ? 'bg-[#F3E9D5] text-[#6E5228]' : 'bg-danger-50 text-ember-ink'
                }`}
              >
                <Icon name={c.ok ? 'check' : 'alert'} size={14} strokeWidth={2.4} />
              </span>
              {c.label}
              <em className="ml-auto text-[12.5px] text-muted not-italic">{c.ok ? 'Complété' : c.optional ? 'Facultatif' : 'Requis'}</em>
            </li>
          ))}
        </ul>
      </div>

      {existing && (
        <Button variant="danger" block icon="trash" onClick={onDelete}>
          Supprimer la fiche
        </Button>
      )}
    </aside>
  );
}
