import { useCallback, useState } from 'react';
import { draftFromMedicine, emptyDraft, type MedicineDraft } from '../../../lib/medicineForm';
import type { MedicineField, MedicineFormValues } from '../../../lib/validation';
import type { DocumentSource, FieldErrors, Medicine } from '../../../types/catalog';

export type DocumentKind = 'leaflet' | 'brochure';

/** État local du formulaire de fiche : valeurs, erreurs et modifications en cours. */
export function useMedicineDraft(initial: Medicine | undefined, initialErrors?: FieldErrors<MedicineField>) {
  const [draft, setDraft] = useState<MedicineDraft>(() => (initial ? draftFromMedicine(initial) : emptyDraft()));
  const [errors, setErrors] = useState<FieldErrors<MedicineField>>(initialErrors ?? {});
  const [dirty, setDirty] = useState(false);

  const clearError = (field: MedicineField) => setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));

  const setValue = useCallback(<K extends keyof MedicineFormValues>(field: K, value: MedicineFormValues[K]) => {
    setDraft((d) => ({ ...d, values: { ...d.values, [field]: value } }));
    clearError(field);
    setDirty(true);
  }, []);

  /** Un fichier importé remplace le lien saisi, et inversement. */
  const setDocument = useCallback((kind: DocumentKind, file: DocumentSource | null) => {
    const urlField = kind === 'leaflet' ? 'leafletUrl' : 'brochureUrl';
    setDraft((d) => ({ ...d, [`${kind}File`]: file, values: { ...d.values, [urlField]: '' } }));
    clearError(urlField);
    setDirty(true);
  }, []);

  const setDocumentUrl = useCallback((kind: DocumentKind, url: string) => {
    const urlField = kind === 'leaflet' ? 'leafletUrl' : 'brochureUrl';
    setDraft((d) => ({ ...d, [`${kind}File`]: url.trim() ? null : d[`${kind}File`], values: { ...d.values, [urlField]: url } }));
    clearError(urlField);
    setDirty(true);
  }, []);

  const markSaved = useCallback((saved: Medicine) => {
    setDraft(draftFromMedicine(saved));
    setErrors({});
    setDirty(false);
  }, []);

  return { draft, errors, setErrors, dirty, setValue, setDocument, setDocumentUrl, markSaved };
}
