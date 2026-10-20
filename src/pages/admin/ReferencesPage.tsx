import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Capsule } from '../../components/brand/Capsule';
import { Button, IconButton } from '../../components/ui/Button';
import { ConfirmDialog, EmptyState } from '../../components/ui/Feedback';
import { FieldError, TextField } from '../../components/ui/Field';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { AdminHeader } from '../../layouts/AdminLayout';
import { swatchAt } from '../../lib/palette';
import { initials, plural } from '../../lib/text';
import { useCatalog, type ReferenceKind } from '../../store/CatalogContext';
import { useToast } from '../../store/ToastContext';

const COPY: Record<ReferenceKind, { title: string; intro: string; add: string; placeholder: string; param: string }> = {
  categories: {
    title: 'Catégories thérapeutiques',
    intro: 'Structurent le catalogue et ses filtres. Une catégorie utilisée par des fiches ne peut pas être supprimée.',
    add: 'Nouvelle catégorie',
    placeholder: 'Ex. Rhumatologie',
    param: 'categorie',
  },
  laboratories: {
    title: 'Laboratoires',
    intro: 'Laboratoires titulaires ou exploitants affichés sur les fiches. Un laboratoire utilisé ne peut pas être supprimé.',
    add: 'Nouveau laboratoire',
    placeholder: 'Ex. Laboratoires Exemple',
    param: 'laboratoire',
  },
};

/** Gestion d'un référentiel (catégories ou laboratoires) : ajout, renommage, suppression. */
export function ReferencesPage({ kind }: { kind: ReferenceKind }) {
  const copy = COPY[kind];
  useDocumentTitle(copy.title);
  const { data, addReference, renameReference, deleteReference, usageCount } = useCatalog();
  const { notify } = useToast();
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string; error: string } | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const items = kind === 'categories' ? data.categories : data.laboratories;

  function add(e: FormEvent) {
    e.preventDefault();
    const result = addReference(kind, newName);
    if (!result.ok) return setAddError(result.error);
    notify(`« ${newName.trim()} » ajouté.`);
    setNewName('');
  }

  function rename(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const result = renameReference(kind, editing.id, editing.name);
    if (!result.ok) return setEditing({ ...editing, error: result.error });
    notify(`Nom mis à jour : « ${editing.name.trim()} ».`);
    setEditing(null);
  }

  function askDelete(id: string, name: string) {
    const used = usageCount(kind, id);
    if (used > 0) {
      notify(`Suppression impossible : ${plural(used, 'fiche est rattachée', 'fiches sont rattachées')} à « ${name} ». Réaffectez-les d’abord.`, 'error');
      return;
    }
    setToDelete({ id, name });
  }

  return (
    <>
      <AdminHeader title={copy.title} subtitle={copy.intro} />

      <section className="surface mb-4 px-[26px] py-6">
        <form noValidate onSubmit={add} className="flex flex-wrap items-start gap-2.5">
          <TextField
            className="flex-[1_1_280px]"
            label={copy.add}
            value={newName}
            placeholder={copy.placeholder}
            error={addError}
            onChange={(e) => {
              setNewName(e.target.value);
              setAddError('');
            }}
          />
          <Button type="submit" icon="plus" className="sm:mt-[29px]">
            Ajouter
          </Button>
        </form>
      </section>

      <section className="surface px-[26px] py-4">
        {items.length === 0 ? (
          <EmptyState title="Aucun élément">Ajoutez-en un avec le formulaire ci-dessus.</EmptyState>
        ) : (
          <ul>
            {items.map((item) => {
              const count = usageCount(kind, item.id);
              const isEditing = editing?.id === item.id;
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-3.5 border-b border-[#F1E7D3] px-1 py-3 last:border-0">
                  {'swatch' in item && typeof item.swatch === 'number' ? (
                    <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: swatchAt(item.swatch).tint }}>
                      <Capsule left={swatchAt(item.swatch).base} right={swatchAt(item.swatch).base} className="h-[11px] w-[26px] opacity-90" />
                    </span>
                  ) : (
                    <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-[17px] font-bold text-navy [font-stretch:80%]">
                      {initials(item.name)}
                    </span>
                  )}
                  {isEditing ? (
                    <form noValidate onSubmit={rename} className="flex flex-[1_1_360px] flex-wrap items-center gap-2">
                      <label htmlFor={`rename-${item.id}`} className="sr-only">
                        Nouveau nom pour {item.name}
                      </label>
                      <input
                        id={`rename-${item.id}`}
                        autoFocus
                        value={editing.name}
                        aria-invalid={!!editing.error}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value, error: '' })}
                        onKeyDown={(e) => e.key === 'Escape' && setEditing(null)}
                        className="field-control flex-[1_1_200px]"
                      />
                      <Button type="submit">Enregistrer</Button>
                      <Button variant="quiet" onClick={() => setEditing(null)}>
                        Annuler
                      </Button>
                      {editing.error && (
                        <div className="w-full">
                          <FieldError>{editing.error}</FieldError>
                        </div>
                      )}
                    </form>
                  ) : (
                    <>
                      <div className="min-w-0 flex-[1_1_200px]">
                        <strong className="block text-base font-semibold text-navy">{item.name}</strong>
                        <small className="text-[13px] text-muted">{plural(count, 'fiche rattachée', 'fiches rattachées')}</small>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Link
                          to={`/catalogue?${copy.param}=${encodeURIComponent(item.id)}`}
                          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-navy hover:bg-sand-100"
                        >
                          Voir au catalogue
                        </Link>
                        <IconButton icon="edit" label={`Renommer ${item.name}`} onClick={() => setEditing({ id: item.id, name: item.name, error: '' })} />
                        <IconButton icon="trash" tone="danger" label={`Supprimer ${item.name}`} onClick={() => askDelete(item.id, item.name)} />
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={!!toDelete}
        title={`Supprimer « ${toDelete?.name ?? ''} » ?`}
        confirmLabel="Supprimer"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            const result = deleteReference(kind, toDelete.id);
            notify(result.ok ? `« ${toDelete.name} » supprimé.` : result.error, result.ok ? 'success' : 'error');
          }
          setToDelete(null);
        }}
      >
        Aucune fiche n’y est rattachée. L’élément sera retiré des listes de choix et des filtres du catalogue.
      </ConfirmDialog>
    </>
  );
}
