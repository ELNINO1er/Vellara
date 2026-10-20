import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildLookups, type Lookups } from '../lib/catalog';
import { contentFromDraft, type MedicineDraft } from '../lib/medicineForm';
import { createId, normalize, uniqueSlug } from '../lib/text';
import { nowIso } from '../lib/date';
import { validateMedicine, validateSettings, hasErrors, type MedicineField } from '../lib/validation';
import { draftFromMedicine } from '../lib/medicineForm';
import { repository } from '../services/repository';
import { addDays, generateShareToken, validateShare, type ShareFormValues } from '../lib/share';
import type { CatalogData, CompanySettings, ContactRequest, DoctorShare, FieldErrors, Medicine, PublicationStatus } from '../types/catalog';
import { useToast } from './ToastContext';

export type ReferenceKind = 'categories' | 'laboratories';

type SaveResult = { ok: true; medicine: Medicine } | { ok: false; errors: FieldErrors<MedicineField> };
type SimpleResult = { ok: true } | { ok: false; error: string };

interface CatalogApi {
  data: CatalogData;
  lookups: Lookups;
  saveMedicine: (id: string | null, draft: MedicineDraft, status: PublicationStatus) => SaveResult;
  setStatus: (id: string, status: PublicationStatus) => SaveResult;
  deleteMedicine: (id: string) => void;
  addReference: (kind: ReferenceKind, name: string) => SimpleResult;
  renameReference: (kind: ReferenceKind, id: string, name: string) => SimpleResult;
  deleteReference: (kind: ReferenceKind, id: string) => SimpleResult;
  usageCount: (kind: ReferenceKind, id: string) => number;
  updateSettings: (settings: CompanySettings) => FieldErrors<keyof CompanySettings> | null;
  addContactRequest: (request: Omit<ContactRequest, 'id' | 'createdAt'>) => void;
  resetDemo: () => void;
  createShare: (values: ShareFormValues) => { ok: true; share: DoctorShare } | { ok: false; errors: FieldErrors<keyof ShareFormValues> };
  revokeShare: (id: string) => void;
  recordShareView: (token: string) => void;
}

const CatalogContext = createContext<CatalogApi | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast();
  const [data, setData] = useState<CatalogData>(() => repository.load());
  const ref = useRef(data);

  /** Applique une mise à jour, l'affiche immédiatement et la persiste. */
  const commit = useCallback(
    (update: (current: CatalogData) => CatalogData) => {
      const next = update(ref.current);
      ref.current = next;
      setData(next);
      const saved = repository.save(next);
      if (!saved.ok)
        notify(
          saved.reason === 'quota'
            ? 'Stockage du navigateur plein : la modification reste visible jusqu’au rechargement. Allégez les fichiers importés.'
            : 'Stockage du navigateur indisponible : la modification ne sera pas conservée après rechargement.',
          'error',
        );
      return next;
    },
    [notify],
  );

  const saveMedicine = useCallback<CatalogApi['saveMedicine']>(
    (id, draft, status) => {
      const current = ref.current;
      const existing = id ? current.medicines.find((m) => m.id === id) : undefined;
      const errors = validateMedicine(draft.values, {
        publish: status === 'published',
        takenNames: current.medicines.filter((m) => m.id !== existing?.id).map((m) => m.name),
      });
      if (hasErrors(errors)) return { ok: false, errors };

      const content = contentFromDraft(draft);
      const now = nowIso();
      const medicine: Medicine = {
        ...content,
        id: existing?.id ?? createId('m'),
        // Le slug reste stable après création : les liens déjà partagés restent valides.
        slug: existing?.slug ?? uniqueSlug(content.name, current.medicines.map((m) => m.slug)),
        status,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      commit((d) => ({
        ...d,
        medicines: existing ? d.medicines.map((m) => (m.id === medicine.id ? medicine : m)) : [medicine, ...d.medicines],
      }));
      return { ok: true, medicine };
    },
    [commit],
  );

  const setStatus = useCallback<CatalogApi['setStatus']>(
    (id, status) => {
      const m = ref.current.medicines.find((x) => x.id === id);
      if (!m) return { ok: false, errors: { name: 'Fiche introuvable.' } };
      if (status === 'published') {
        const errors = validateMedicine(draftFromMedicine(m).values, {
          publish: true,
          takenNames: ref.current.medicines.filter((x) => x.id !== id).map((x) => x.name),
        });
        if (hasErrors(errors)) return { ok: false, errors };
      }
      const updated: Medicine = { ...m, status, updatedAt: nowIso() };
      commit((d) => ({ ...d, medicines: d.medicines.map((x) => (x.id === id ? updated : x)) }));
      return { ok: true, medicine: updated };
    },
    [commit],
  );

  const deleteMedicine = useCallback(
    (id: string) => commit((d) => ({ ...d, medicines: d.medicines.filter((m) => m.id !== id) })),
    [commit],
  );

  const usageCount = useCallback(
    (kind: ReferenceKind, id: string) =>
      ref.current.medicines.filter((m) => (kind === 'categories' ? m.categoryId : m.laboratoryId) === id).length,
    [],
  );

  const addReference = useCallback<CatalogApi['addReference']>(
    (kind, raw) => {
      const name = raw.trim();
      if (!name) return { ok: false, error: 'Saisissez un nom.' };
      if (ref.current[kind].some((x) => normalize(x.name) === normalize(name))) return { ok: false, error: 'Ce nom existe déjà.' };
      commit((d) =>
        kind === 'categories'
          ? { ...d, categories: [...d.categories, { id: createId('cat'), name, swatch: d.categories.length }] }
          : { ...d, laboratories: [...d.laboratories, { id: createId('lab'), name }] },
      );
      return { ok: true };
    },
    [commit],
  );

  const renameReference = useCallback<CatalogApi['renameReference']>(
    (kind, id, raw) => {
      const name = raw.trim();
      if (!name) return { ok: false, error: 'Le nom ne peut pas être vide.' };
      if (ref.current[kind].some((x) => x.id !== id && normalize(x.name) === normalize(name)))
        return { ok: false, error: 'Ce nom existe déjà.' };
      commit((d) =>
        kind === 'categories'
          ? { ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, name } : c)) }
          : { ...d, laboratories: d.laboratories.map((l) => (l.id === id ? { ...l, name } : l)) },
      );
      return { ok: true };
    },
    [commit],
  );

  const deleteReference = useCallback<CatalogApi['deleteReference']>(
    (kind, id) => {
      const used = usageCount(kind, id);
      if (used > 0)
        return { ok: false, error: `Suppression impossible : ${used} fiche${used > 1 ? 's' : ''} y ${used > 1 ? 'sont rattachées' : 'est rattachée'}. Réaffectez-les d’abord.` };
      commit((d) =>
        kind === 'categories'
          ? { ...d, categories: d.categories.filter((c) => c.id !== id) }
          : { ...d, laboratories: d.laboratories.filter((l) => l.id !== id) },
      );
      return { ok: true };
    },
    [commit, usageCount],
  );

  const updateSettings = useCallback<CatalogApi['updateSettings']>(
    (settings) => {
      const errors = validateSettings(settings);
      if (hasErrors(errors)) return errors;
      commit((d) => ({
        ...d,
        settings: { ...settings, companyName: settings.companyName.trim(), publicBaseUrl: settings.publicBaseUrl.trim().replace(/\/+$/, '') },
      }));
      return null;
    },
    [commit],
  );

  const addContactRequest = useCallback<CatalogApi['addContactRequest']>(
    (request) =>
      commit((d) => ({
        ...d,
        contactRequests: [{ ...request, id: createId('req'), createdAt: nowIso() }, ...d.contactRequests].slice(0, 100),
      })),
    [commit],
  );

  const createShare = useCallback<CatalogApi['createShare']>(
    (values) => {
      const publishedIds = ref.current.medicines.filter((m) => m.status === 'published').map((m) => m.id);
      const errors = validateShare(values, publishedIds);
      if (hasErrors(errors)) return { ok: false, errors };
      const now = nowIso();
      const share: DoctorShare = {
        id: createId('share'),
        token: generateShareToken(),
        medicineId: values.medicineId,
        recipientName: values.recipientName.trim(),
        recipientEmail: values.recipientEmail.trim(),
        specialty: values.specialty.trim(),
        message: values.message.trim(),
        createdAt: now,
        expiresAt: addDays(now, values.duration),
        views: 0,
        lastViewedAt: null,
        revokedAt: null,
      };
      commit((d) => ({ ...d, shares: [share, ...d.shares] }));
      return { ok: true, share };
    },
    [commit],
  );

  const revokeShare = useCallback(
    (id: string) => commit((d) => ({ ...d, shares: d.shares.map((s) => (s.id === id ? { ...s, revokedAt: nowIso() } : s)) })),
    [commit],
  );

  const recordShareView = useCallback(
    (token: string) =>
      commit((d) => ({ ...d, shares: d.shares.map((s) => (s.token === token ? { ...s, views: s.views + 1, lastViewedAt: nowIso() } : s)) })),
    [commit],
  );

  const resetDemo = useCallback(() => {
    const fresh = repository.reset();
    ref.current = fresh;
    setData(fresh);
  }, []);

  const lookups = useMemo(() => buildLookups(data), [data]);

  const api = useMemo<CatalogApi>(
    () => ({
      data,
      lookups,
      saveMedicine,
      setStatus,
      deleteMedicine,
      addReference,
      renameReference,
      deleteReference,
      usageCount,
      updateSettings,
      addContactRequest,
      resetDemo,
      createShare,
      revokeShare,
      recordShareView,
    }),
    [data, lookups, saveMedicine, setStatus, deleteMedicine, addReference, renameReference, deleteReference, usageCount, updateSettings, addContactRequest, resetDemo, createShare, revokeShare, recordShareView],
  );

  return <CatalogContext.Provider value={api}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogApi {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog doit être utilisé dans <CatalogProvider>');
  return ctx;
}
