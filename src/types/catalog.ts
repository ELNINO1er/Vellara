/** Modèle de données du catalogue. Indépendant de la persistance (voir services/). */

export type PublicationStatus = 'draft' | 'published';

export interface Category {
  id: string;
  name: string;
  /** Index dans la palette des aires thérapeutiques (lib/palette.ts). */
  swatch: number;
}

export interface Laboratory {
  id: string;
  name: string;
}

/** Un document peut être un lien, un fichier importé, ou un document fictif de démonstration. */
export type DocumentSource =
  | { type: 'url'; name: string; url: string }
  | { type: 'file'; name: string; dataUrl: string; size: number }
  | { type: 'demo'; name: string };

/** Rubriques médicales : alimentées uniquement à partir de documents validés. */
export interface MedicalContent {
  indications: string;
  contraindications: string;
  precautions: string;
  adverseEffects: string;
}

export interface Medicine {
  id: string;
  slug: string;
  name: string;
  activeSubstance: string;
  laboratoryId: string;
  categoryId: string;
  strength: string;
  dosageForm: string;
  packaging: string;
  description: string;
  /** URL https ou data URL d'une image importée. */
  image: string | null;
  gallery: string[];
  medical: MedicalContent;
  leaflet: DocumentSource | null;
  brochure: DocumentSource | null;
  videoUrl: string | null;
  source: string;
  featured: boolean;
  status: PublicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  intro: string;
  email: string;
  phone: string;
  address: string;
  publicBaseUrl: string;
}

export interface ContactRequest {
  id: string;
  name: string;
  organization: string;
  profession: string;
  email: string;
  medicineId: string;
  message: string;
  createdAt: string;
}

/** Partage nominatif d'une fiche à un professionnel de santé. */
export interface DoctorShare {
  id: string;
  /** Jeton aléatoire non devinable, utilisé dans le lien. */
  token: string;
  medicineId: string;
  recipientName: string;
  recipientEmail: string;
  specialty: string;
  message: string;
  createdAt: string;
  expiresAt: string;
  views: number;
  lastViewedAt: string | null;
  revokedAt: string | null;
}

export interface CatalogData {
  version: 1;
  settings: CompanySettings;
  categories: Category[];
  laboratories: Laboratory[];
  medicines: Medicine[];
  contactRequests: ContactRequest[];
  shares: DoctorShare[];
}

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;
