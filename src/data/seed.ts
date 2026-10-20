import { BRAND_DEFAULTS, MEDICAL_PLACEHOLDER } from '../config/brand';
import { slugify } from '../lib/text';
import type { CatalogData, DocumentSource, Medicine } from '../types/catalog';

/**
 * Données de démonstration : produits, substances et laboratoires FICTIFS.
 * Aucune posologie, efficacité ou autorisation n'est renseignée.
 *
 * Vidéos de test (libres de droits, sans rapport avec les produits) pour simuler
 * chaque mode d'affichage : YouTube et Vimeo (lecteur intégré), fichier MP4
 * (lecture directe), simple page web (bouton d'ouverture).
 */

const DESCRIPTION =
  'Produit fictif créé pour la démonstration de la plateforme. La présentation définitive sera rédigée à partir des documents validés de l’entreprise.';

const demoDoc = (name: string): DocumentSource => ({ type: 'demo', name });

type SeedInput = Pick<
  Medicine,
  'id' | 'name' | 'activeSubstance' | 'strength' | 'dosageForm' | 'packaging' | 'categoryId' | 'laboratoryId' | 'status'
> &
  Partial<Pick<Medicine, 'videoUrl' | 'featured' | 'leaflet' | 'brochure'>> & { date: string };

function medicine(input: SeedInput): Medicine {
  const { date, ...rest } = input;
  return {
    slug: slugify(input.name),
    description: DESCRIPTION,
    image: null,
    gallery: [],
    medical: {
      indications: MEDICAL_PLACEHOLDER,
      contraindications: MEDICAL_PLACEHOLDER,
      precautions: MEDICAL_PLACEHOLDER,
      adverseEffects: MEDICAL_PLACEHOLDER,
    },
    leaflet: null,
    brochure: null,
    videoUrl: null,
    source: 'Dossier documentaire interne — référence à compléter (démonstration)',
    featured: false,
    createdAt: date,
    updatedAt: date,
    ...rest,
  };
}

export function createSeedData(): CatalogData {
  return {
    version: 1,
    settings: { ...BRAND_DEFAULTS },
    categories: [
      { id: 'cardio', name: 'Cardiologie', swatch: 0 },
      { id: 'pneumo', name: 'Pneumologie', swatch: 1 },
      { id: 'gastro', name: 'Gastro-entérologie', swatch: 2 },
      { id: 'neuro', name: 'Neurologie', swatch: 3 },
      { id: 'dermato', name: 'Dermatologie', swatch: 4 },
      { id: 'infect', name: 'Anti-infectieux', swatch: 5 },
    ],
    laboratories: [
      { id: 'aurelle', name: 'Laboratoires Aurelle' },
      { id: 'nordis', name: 'Nordis Santé' },
      { id: 'biovance', name: 'Biovance Pharma' },
    ],
    medicines: [
      medicine({ id: 'm-cardivel', name: 'Cardivel', activeSubstance: 'Velmoprane', strength: '5 mg', dosageForm: 'Comprimé pelliculé', packaging: 'Boîte de 30 comprimés pelliculés', categoryId: 'cardio', laboratoryId: 'aurelle', status: 'published', videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', featured: true, leaflet: demoDoc('Notice Cardivel (démo).pdf'), brochure: demoDoc('Brochure Cardivel (démo).pdf'), date: '2026-10-14' }),
      medicine({ id: 'm-respilane', name: 'Respilane', activeSubstance: 'Oxatérol', strength: '100 µg/dose', dosageForm: 'Suspension pour inhalation', packaging: 'Flacon pressurisé de 120 doses', categoryId: 'pneumo', laboratoryId: 'nordis', status: 'published', videoUrl: 'https://vimeo.com/1084537', featured: true, leaflet: demoDoc('Notice Respilane (démo).pdf'), date: '2026-10-09' }),
      medicine({ id: 'm-gastrelia', name: 'Gastrélia', activeSubstance: 'Prazomidine', strength: '20 mg', dosageForm: 'Gélule', packaging: 'Boîte de 28 gélules', categoryId: 'gastro', laboratoryId: 'biovance', status: 'published', featured: true, videoUrl: 'https://www.blender.org/about/projects/', date: '2026-09-30' }),
      medicine({ id: 'm-neurastel', name: 'Neurastel', activeSubstance: 'Lamivétine', strength: '50 mg', dosageForm: 'Comprimé', packaging: 'Boîte de 60 comprimés', categoryId: 'neuro', laboratoryId: 'aurelle', status: 'published', videoUrl: 'https://www.youtube.com/watch?v=eRsGyueVLvQ', featured: true, brochure: demoDoc('Brochure Neurastel (démo).pdf'), date: '2026-09-22' }),
      medicine({ id: 'm-dermacalm', name: 'Dermacalm', activeSubstance: 'Hydrocortène', strength: '1 %', dosageForm: 'Crème', packaging: 'Tube de 30 g', categoryId: 'dermato', laboratoryId: 'nordis', status: 'published', date: '2026-09-18' }),
      medicine({ id: 'm-infexil', name: 'Infexil', activeSubstance: 'Céfaludine', strength: '250 mg/5 ml', dosageForm: 'Poudre pour suspension buvable', packaging: 'Flacon de 60 ml', categoryId: 'infect', laboratoryId: 'biovance', status: 'published', videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', leaflet: demoDoc('Notice Infexil (démo).pdf'), date: '2026-09-12' }),
      medicine({ id: 'm-bronchilis', name: 'Bronchilis', activeSubstance: 'Carbométhine', strength: '2 %', dosageForm: 'Sirop', packaging: 'Flacon de 200 ml', categoryId: 'pneumo', laboratoryId: 'aurelle', status: 'published', date: '2026-09-05' }),
      medicine({ id: 'm-cutavir', name: 'Cutavir', activeSubstance: 'Aciclorène', strength: '5 %', dosageForm: 'Crème', packaging: 'Tube de 10 g', categoryId: 'dermato', laboratoryId: 'biovance', status: 'published', date: '2026-08-28' }),
      medicine({ id: 'm-tensolis', name: 'Tensolis', activeSubstance: 'Amlorétine', strength: '10 mg', dosageForm: 'Comprimé', packaging: 'Boîte de 30 comprimés', categoryId: 'cardio', laboratoryId: 'nordis', status: 'draft', date: '2026-10-17' }),
      medicine({ id: 'm-migralys', name: 'Migralys', activeSubstance: 'Triptalène', strength: '2,5 mg', dosageForm: 'Comprimé orodispersible', packaging: 'Boîte de 6 comprimés', categoryId: 'neuro', laboratoryId: 'biovance', status: 'draft', videoUrl: 'https://www.youtube.com/watch?v=R6MlUcmOul8', date: '2026-10-19' }),
    ],
    contactRequests: [],
    shares: [
      {
        id: 'share-demo',
        token: 'demo-cardivel-7Kq2xW9pLm',
        medicineId: 'm-cardivel',
        recipientName: 'Dr Claire Morel (fictif)',
        recipientEmail: 'claire.morel@exemple.fr',
        specialty: 'Cardiologue',
        message: 'Bonjour Docteur, comme convenu lors de notre échange, voici la fiche de présentation de Cardivel avec sa vidéo et sa documentation.',
        createdAt: '2026-10-15T09:30:00.000Z',
        expiresAt: '2027-01-13T09:30:00.000Z',
        views: 3,
        lastViewedAt: '2026-10-18T16:05:00.000Z',
        revokedAt: null,
      },
    ],
  };
}
