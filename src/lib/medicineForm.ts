import { MEDICAL_PLACEHOLDER } from '../config/brand';
import type { DocumentSource, Medicine } from '../types/catalog';
import { splitLines, type MedicineFormValues } from './validation';

/** État du formulaire : valeurs texte + documents importés conservés à part. */
export interface MedicineDraft {
  values: MedicineFormValues;
  leafletFile: DocumentSource | null;
  brochureFile: DocumentSource | null;
}

export function emptyDraft(): MedicineDraft {
  return {
    values: {
      name: '',
      activeSubstance: '',
      laboratoryId: '',
      categoryId: '',
      strength: '',
      dosageForm: '',
      packaging: '',
      description: '',
      featured: false,
      image: '',
      galleryText: '',
      indications: MEDICAL_PLACEHOLDER,
      contraindications: MEDICAL_PLACEHOLDER,
      precautions: MEDICAL_PLACEHOLDER,
      adverseEffects: MEDICAL_PLACEHOLDER,
      leafletUrl: '',
      brochureUrl: '',
      videoUrl: '',
      source: '',
    },
    leafletFile: null,
    brochureFile: null,
  };
}

const urlOf = (d: DocumentSource | null) => (d?.type === 'url' ? d.url : '');
const fileOf = (d: DocumentSource | null) => (d && d.type !== 'url' ? d : null);

export function draftFromMedicine(m: Medicine): MedicineDraft {
  return {
    values: {
      name: m.name,
      activeSubstance: m.activeSubstance,
      laboratoryId: m.laboratoryId,
      categoryId: m.categoryId,
      strength: m.strength,
      dosageForm: m.dosageForm,
      packaging: m.packaging,
      description: m.description,
      featured: m.featured,
      image: m.image ?? '',
      galleryText: m.gallery.join('\n'),
      indications: m.medical.indications,
      contraindications: m.medical.contraindications,
      precautions: m.medical.precautions,
      adverseEffects: m.medical.adverseEffects,
      leafletUrl: urlOf(m.leaflet),
      brochureUrl: urlOf(m.brochure),
      videoUrl: m.videoUrl ?? '',
      source: m.source,
    },
    leafletFile: fileOf(m.leaflet),
    brochureFile: fileOf(m.brochure),
  };
}

function documentFrom(url: string, file: DocumentSource | null, label: string): DocumentSource | null {
  if (file) return file;
  const u = url.trim();
  if (!u) return null;
  const name = decodeURIComponent(u.split('/').pop()?.split('?')[0] || '') || label;
  return { type: 'url', name, url: u };
}

/** Champs métier issus du brouillon (sans id, slug, statut ni dates). */
export type MedicineContent = Omit<Medicine, 'id' | 'slug' | 'status' | 'createdAt' | 'updatedAt'>;

export function contentFromDraft(d: MedicineDraft): MedicineContent {
  const v = d.values;
  const medical = (s: string) => s.trim() || MEDICAL_PLACEHOLDER;
  return {
    name: v.name.trim(),
    activeSubstance: v.activeSubstance.trim(),
    laboratoryId: v.laboratoryId,
    categoryId: v.categoryId,
    strength: v.strength.trim(),
    dosageForm: v.dosageForm,
    packaging: v.packaging.trim(),
    description: v.description.trim(),
    featured: v.featured,
    image: v.image.trim() || null,
    gallery: splitLines(v.galleryText),
    medical: {
      indications: medical(v.indications),
      contraindications: medical(v.contraindications),
      precautions: medical(v.precautions),
      adverseEffects: medical(v.adverseEffects),
    },
    leaflet: documentFrom(v.leafletUrl, d.leafletFile, 'Notice'),
    brochure: documentFrom(v.brochureUrl, d.brochureFile, 'Brochure'),
    videoUrl: v.videoUrl.trim() || null,
    source: v.source.trim(),
  };
}
