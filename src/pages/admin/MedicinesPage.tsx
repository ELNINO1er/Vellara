import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ProductMedia } from '../../components/product/ProductVisual';
import { useMedicineMeta } from '../../components/product/useMedicineMeta';
import { Button, ButtonLink, IconButton } from '../../components/ui/Button';
import { ConfirmDialog, EmptyState, StatusBadge } from '../../components/ui/Feedback';
import { InlineSelect } from '../../components/ui/Field';
import { Icon } from '../../components/ui/Icon';
import { ShareDialog } from '../../components/share/ShareDialog';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { AdminHeader } from '../../layouts/AdminLayout';
import { isPublished, matchesQuery, sortMedicines } from '../../lib/catalog';
import { swatchAt } from '../../lib/palette';
import { plural } from '../../lib/text';
import { useCatalog } from '../../store/CatalogContext';
import { useToast } from '../../store/ToastContext';
import type { Medicine } from '../../types/catalog';

type AdminSort = 'updated' | 'name' | 'status' | 'category';
const STATUS_PARAM: Record<string, Medicine['status']> = { publiee: 'published', brouillon: 'draft' };

export function MedicinesPage() {
  useDocumentTitle('Médicaments');
  const { data, lookups, setStatus, deleteMedicine } = useCatalog();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [toDelete, setToDelete] = useState<Medicine | null>(null);
  const [toShare, setToShare] = useState<string | null>(null);

  const q = params.get('q') ?? '';
  const status = STATUS_PARAM[params.get('statut') ?? ''] ?? '';
  const category = params.get('categorie') ?? '';
  const sort = (params.get('tri') as AdminSort) || 'updated';

  const setParam = (key: string, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  const items = useMemo(() => {
    const filtered = data.medicines.filter(
      (m) => matchesQuery(m, q, lookups) && (!status || m.status === status) && (!category || m.categoryId === category),
    );
    return sortMedicines(filtered, sort, lookups);
  }, [data.medicines, q, status, category, sort, lookups]);

  const published = data.medicines.filter(isPublished).length;

  function toggle(m: Medicine) {
    const target = isPublished(m) ? 'draft' : 'published';
    const result = setStatus(m.id, target);
    if (result.ok) {
      notify(target === 'published' ? `« ${m.name} » est publiée et visible dans le catalogue.` : `« ${m.name} » est retirée du catalogue (brouillon).`);
    } else {
      notify('Fiche incomplète : complétez les champs signalés avant publication.', 'error');
      navigate(`/admin/medicaments/${m.id}`, { state: { errors: result.errors } });
    }
  }

  return (
    <>
      <AdminHeader
        title="Médicaments"
        subtitle={`${plural(data.medicines.length, 'fiche', 'fiches')} · ${plural(published, 'publiée', 'publiées')} · ${plural(
          data.medicines.length - published,
          'brouillon',
          'brouillons',
        )}`}
        actions={
          <ButtonLink to="/admin/medicaments/nouveau" icon="plus">
            Nouveau médicament
          </ButtonLink>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div role="search" className="relative flex-[1_1_280px]">
          <label htmlFor="admin-search" className="sr-only">
            Rechercher une fiche
          </label>
          <Icon name="search" className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input
            id="admin-search"
            type="search"
            value={q}
            onChange={(e) => setParam('q', e.target.value)}
            placeholder="Rechercher nom, DCI, laboratoire…"
            className="field-control h-12 rounded-full pl-12"
          />
        </div>
        <InlineSelect
          label="Filtrer par statut"
          value={params.get('statut') ?? ''}
          onChange={(v) => setParam('statut', v)}
          options={[
            { value: '', label: 'Tous les statuts' },
            { value: 'publiee', label: 'Publiées' },
            { value: 'brouillon', label: 'Brouillons' },
          ]}
        />
        <InlineSelect
          label="Filtrer par catégorie"
          value={category}
          onChange={(v) => setParam('categorie', v)}
          options={[{ value: '', label: 'Toutes les catégories' }, ...data.categories.map((c) => ({ value: c.id, label: c.name, swatch: swatchAt(c.swatch).base, count: data.medicines.filter((m) => m.categoryId === c.id).length }))]}
        />
        <InlineSelect
          label="Trier"
          value={sort}
          onChange={(v) => setParam('tri', v === 'updated' ? '' : v)}
          options={[
            { value: 'updated', label: 'Mise à jour récente' },
            { value: 'name', label: 'Nom (A → Z)' },
            { value: 'status', label: 'Brouillons d’abord' },
            { value: 'category', label: 'Catégorie' },
          ]}
        />
      </div>

      {data.medicines.length === 0 ? (
        <EmptyState title="Le catalogue est vide" tone="bordeaux" action={<ButtonLink to="/admin/medicaments/nouveau">Créer une fiche</ButtonLink>}>
          Créez votre première fiche : elle restera en brouillon jusqu’à sa publication.
        </EmptyState>
      ) : items.length === 0 ? (
        <EmptyState title="Aucune fiche ne correspond" action={<Button variant="ghost" onClick={() => setParams({}, { replace: true })}>Réinitialiser</Button>}>
          Modifiez la recherche ou les filtres pour afficher d’autres fiches.
        </EmptyState>
      ) : (
        <div className="surface relative overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse">
            <caption className="sr-only">Liste des fiches médicaments ({items.length})</caption>
            <thead>
              <tr className="bg-[#FFFBF3] text-left text-[11.5px] tracking-[0.12em] whitespace-nowrap text-muted uppercase">
                {['Produit', 'Catégorie', 'Laboratoire', 'Statut', 'Vidéo', 'Mise à jour'].map((h) => (
                  <th key={h} scope="col" className="border-b border-sand-200 px-4 py-3.5 font-semibold">
                    {h}
                  </th>
                ))}
                <th scope="col" className="border-b border-sand-200 px-4 py-3.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <MedicineRow key={m.id} medicine={m} onToggle={() => toggle(m)} onDelete={() => setToDelete(m)} onShare={() => setToShare(m.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ShareDialog open={!!toShare} medicineId={toShare ?? undefined} onClose={() => setToShare(null)} />

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer cette fiche ?"
        confirmLabel="Supprimer la fiche"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            deleteMedicine(toDelete.id);
            notify(`Fiche « ${toDelete.name} » supprimée.`);
          }
          setToDelete(null);
        }}
      >
        La fiche « {toDelete?.name} » sera définitivement supprimée du catalogue et de l’administration. Cette action est irréversible.
      </ConfirmDialog>
    </>
  );
}

function MedicineRow({ medicine: m, onToggle, onDelete, onShare }: { medicine: Medicine; onToggle: () => void; onDelete: () => void; onShare: () => void }) {
  const meta = useMedicineMeta(m);
  const pub = isPublished(m);
  return (
    <tr className="border-b border-[#F1E7D3] text-[14.5px] transition-colors last:border-0 hover:bg-[#FFFBF3]">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="block h-[46px] w-[58px] shrink-0 overflow-hidden rounded-xl">
            <ProductMedia image={m.image} alt="" name={m.name} swatch={meta.swatch} padding="px-1.5" />
          </span>
          <span className="min-w-0">
            <Link to={`/admin/medicaments/${m.id}`} className="block text-[15.5px] font-semibold text-navy hover:text-bordeaux hover:underline">
              {m.name}
            </Link>
            <small className="block text-[13px] text-muted">
              {m.activeSubstance || '—'} · <span className="font-mono">{m.strength || '—'}</span>
            </small>
          </span>
        </div>
      </td>
      <td className="px-4 py-3">{meta.categoryName}</td>
      <td className="px-4 py-3">{meta.laboratoryName}</td>
      <td className="px-4 py-3">
        <StatusBadge status={m.status} />
      </td>
      <td className="px-4 py-3">
        {meta.video ? (
          <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-navy">
            <Icon name="play" size={16} className="text-ember" />
            {meta.video.provider}
          </span>
        ) : (
          <span className="text-[#6A7A86]" aria-label="Aucune vidéo">—</span>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-[13.5px]">{meta.updatedShort}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-0.5">
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {pub ? 'Retirer' : 'Publier'}
          </Button>
          <Link
            to={`/catalogue/${m.slug}`}
            aria-label={pub ? `Voir la fiche publique de ${m.name}` : `Voir le brouillon de ${m.name}`}
            title="Voir"
            className="grid size-11 place-items-center rounded-xl text-ink hover:bg-sand-100 hover:text-navy"
          >
            <Icon name="eye" size={19} />
          </Link>
          <Link
            to={`/admin/medicaments/${m.id}`}
            aria-label={`Modifier ${m.name}`}
            title="Modifier"
            className="grid size-11 place-items-center rounded-xl text-ink hover:bg-sand-100 hover:text-navy"
          >
            <Icon name="edit" size={19} />
          </Link>
          <IconButton
            icon="send"
            label={pub ? `Partager ${m.name} à un médecin` : `Publiez ${m.name} pour pouvoir la partager`}
            onClick={onShare}
            disabled={!pub}
            className="disabled:opacity-35"
          />
          <IconButton icon="trash" tone="danger" label={`Supprimer ${m.name}`} onClick={onDelete} />
        </div>
      </td>
    </tr>
  );
}
