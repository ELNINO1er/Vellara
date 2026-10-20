import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useBlocker, useLocation, useNavigate, useParams } from 'react-router';
import { ProductDetail } from '../../../components/product/ProductDetail';
import { ShareDialog } from '../../../components/share/ShareDialog';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog, EmptyState } from '../../../components/ui/Feedback';
import { Icon } from '../../../components/ui/Icon';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AdminHeader } from '../../../layouts/AdminLayout';
import { nowIso } from '../../../lib/date';
import { contentFromDraft } from '../../../lib/medicineForm';
import { slugify } from '../../../lib/text';
import type { MedicineField } from '../../../lib/validation';
import { useCatalog } from '../../../store/CatalogContext';
import { useToast } from '../../../store/ToastContext';
import type { FieldErrors, Medicine, PublicationStatus } from '../../../types/catalog';
import {
  DocumentsSection,
  IdentificationSection,
  MedicalSection,
  PresentationSection,
  SourceSection,
  VideoSection,
  VisualsSection,
} from './EditorSections';
import { EditorSidebar } from './EditorSidebar';
import { useMedicineDraft } from './useMedicineDraft';

export function MedicineEditorPage() {
  const { id } = useParams();
  const { data } = useCatalog();
  const existing = id ? data.medicines.find((m) => m.id === id) : undefined;

  if (id && !existing) {
    return (
      <EmptyState title="Fiche introuvable" tone="bordeaux" action={<Link to="/admin/medicaments" className="font-semibold text-bordeaux underline">Retour à la liste</Link>}>
        Cette fiche a peut-être été supprimée.
      </EmptyState>
    );
  }
  // La clé réinitialise le formulaire quand on passe d'une fiche à l'autre.
  return <Editor key={existing?.id ?? 'new'} existing={existing} />;
}

function Editor({ existing }: { existing: Medicine | undefined }) {
  const { saveMedicine, deleteMedicine } = useCatalog();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const incomingErrors = (location.state as { errors?: FieldErrors<MedicineField> } | null)?.errors;
  const form = useMedicineDraft(existing, incomingErrors);
  const [preview, setPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const skipBlocker = useRef(false);
  const errorSummary = useRef<HTMLDivElement>(null);

  useDocumentTitle(existing ? `Modifier ${existing.name}` : 'Nouveau médicament');

  // Protection contre la perte des modifications non enregistrées.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => form.dirty && !skipBlocker.current && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!form.dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [form.dirty]);

  const errorList = Object.values(form.errors).filter(Boolean) as string[];

  function save(status: PublicationStatus) {
    const result = saveMedicine(existing?.id ?? null, form.draft, status);
    if (!result.ok) {
      form.setErrors(result.errors);
      notify(`${status === 'published' ? 'Publication' : 'Enregistrement'} impossible : ${Object.keys(result.errors).length} champ(s) à corriger.`, 'error');
      requestAnimationFrame(() => errorSummary.current?.focus());
      return null;
    }
    form.markSaved(result.medicine);
    const wasPublished = existing?.status === 'published';
    notify(
      status === 'published'
        ? `« ${result.medicine.name} » est publiée et visible dans le catalogue.`
        : wasPublished
          ? `« ${result.medicine.name} » est repassée en brouillon et retirée du catalogue.`
          : `Brouillon « ${result.medicine.name} » enregistré.`,
    );
    if (!existing) {
      skipBlocker.current = true;
      navigate(`/admin/medicaments/${result.medicine.id}`, { replace: true });
    }
    return result.medicine;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save('published');
  }

  const previewMedicine: Medicine = {
    ...contentFromDraft(form.draft),
    id: existing?.id ?? 'apercu',
    slug: existing?.slug ?? slugify(form.draft.values.name),
    status: 'draft',
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };

  return (
    <>
      <AdminHeader
        title={existing ? existing.name : 'Nouveau médicament'}
        subtitle="Les champs marqués * sont requis pour publier. Un brouillon ne demande que le nom commercial."
        back={
          <Link to="/admin/medicaments" className="mb-2 inline-flex items-center gap-1.5 py-1.5 font-semibold text-bordeaux underline underline-offset-4">
            <Icon name="arrowLeft" size={18} />
            Tous les médicaments
          </Link>
        }
      />

      <form noValidate onSubmit={onSubmit} className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          {errorList.length > 0 && (
            <div ref={errorSummary} tabIndex={-1} role="alert" className="rounded-[18px] border border-[#F0BDB6] bg-danger-50 px-[22px] py-[18px] text-[#6E0910]">
              <h2 className="mb-1.5 flex items-center gap-2 font-bold">
                <Icon name="alert" />
                {errorList.length > 1 ? `${errorList.length} points à corriger` : '1 point à corriger'}
              </h2>
              <ul className="list-disc pl-5 text-[14.5px]">
                {errorList.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
          <IdentificationSection form={form} />
          <PresentationSection form={form} />
          <VisualsSection form={form} />
          <MedicalSection form={form} />
          <DocumentsSection form={form} />
          <VideoSection form={form} />
          <SourceSection form={form} />
        </div>
        <EditorSidebar
          form={form}
          existing={existing}
          onSaveDraft={() => save('draft')}
          onPreview={() => setPreview(true)}
          onDelete={() => setConfirmDelete(true)}
          onShare={() => setShareOpen(true)}
        />
      </form>

      <ShareDialog open={shareOpen} medicineId={existing?.id} onClose={() => setShareOpen(false)} />

      {preview && (
        <PreviewOverlay
          medicine={previewMedicine}
          onClose={() => setPreview(false)}
          onPublish={() => {
            const saved = save('published');
            if (saved) {
              skipBlocker.current = true;
              navigate(`/catalogue/${saved.slug}`);
            } else setPreview(false);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer cette fiche ?"
        confirmLabel="Supprimer la fiche"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!existing) return;
          skipBlocker.current = true;
          deleteMedicine(existing.id);
          notify(`Fiche « ${existing.name} » supprimée.`);
          navigate('/admin/medicaments', { replace: true });
        }}
      >
        La fiche « {existing?.name} » sera définitivement supprimée du catalogue et de l’administration. Cette action est irréversible.
      </ConfirmDialog>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Quitter sans enregistrer ?"
        confirmLabel="Quitter la page"
        icon="alert"
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      >
        Les modifications apportées à cette fiche ne sont pas enregistrées et seront perdues.
      </ConfirmDialog>
    </>
  );
}

/** Aperçu plein écran de la fiche telle qu'elle apparaîtra dans le catalogue. */
function PreviewOverlay({ medicine, onClose, onPublish }: { medicine: Medicine; onClose: () => void; onPublish: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-label={`Aperçu de la fiche ${medicine.name}`}
      className="m-0 h-full max-h-none w-full max-w-none overflow-y-auto bg-ivory p-0 backdrop:bg-navy/60"
    >
      <div className="sticky top-0 z-10 bg-navy text-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3 text-[14.5px]">
          <span>
            <strong className="text-cream">Aperçu avant publication.</strong> Cette version n’est pas encore visible dans le catalogue.
          </span>
          <div className="flex flex-wrap gap-2">
            <Button variant="light" icon="arrowLeft" onClick={onClose} autoFocus>
              Retour à l’édition
            </Button>
            <Button variant="accent" onClick={onPublish}>
              Publier maintenant
            </Button>
          </div>
        </div>
      </div>
      <div className="pt-8">
        <ProductDetail medicine={medicine} preview />
      </div>
    </dialog>
  );
}
