import type { CompanySettings, FieldErrors } from '../types/catalog';
import { normalize } from './text';

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Valeurs saisies dans le formulaire de fiche (toutes en texte). */
export interface MedicineFormValues {
  name: string;
  activeSubstance: string;
  laboratoryId: string;
  categoryId: string;
  strength: string;
  dosageForm: string;
  packaging: string;
  description: string;
  featured: boolean;
  image: string;
  galleryText: string;
  indications: string;
  contraindications: string;
  precautions: string;
  adverseEffects: string;
  leafletUrl: string;
  brochureUrl: string;
  videoUrl: string;
  source: string;
}

export type MedicineField = keyof MedicineFormValues;

interface MedicineRules {
  /** true : contrôles complets requis pour publier ; false : brouillon. */
  publish: boolean;
  /** Noms déjà utilisés par d'autres fiches. */
  takenNames: string[];
}

export function validateMedicine(v: MedicineFormValues, rules: MedicineRules): FieldErrors<MedicineField> {
  const e: FieldErrors<MedicineField> = {};
  const t = (s: string) => s.trim();

  if (!t(v.name)) e.name = 'Le nom commercial est obligatoire.';
  else if (rules.takenNames.some((n) => normalize(n) === normalize(t(v.name))))
    e.name = 'Une fiche existe déjà sous ce nom commercial.';

  if (rules.publish) {
    if (!t(v.activeSubstance)) e.activeSubstance = 'Indiquez la substance active (DCI).';
    if (!v.laboratoryId) e.laboratoryId = 'Sélectionnez un laboratoire.';
    if (!v.categoryId) e.categoryId = 'Sélectionnez une catégorie thérapeutique.';
    if (!t(v.strength)) e.strength = 'Indiquez le dosage.';
    if (!v.dosageForm) e.dosageForm = 'Sélectionnez la forme pharmaceutique.';
    if (!t(v.packaging)) e.packaging = 'Précisez le conditionnement.';
    if (t(v.description).length < 20) e.description = 'Rédigez une description d’au moins 20 caractères.';
    if (!t(v.source)) e.source = 'La source documentaire est obligatoire pour publier.';
  }

  if (t(v.image) && !v.image.startsWith('data:image/') && !isHttpUrl(t(v.image)))
    e.image = 'Adresse d’image invalide : elle doit commencer par https://';

  const badImage = splitLines(v.galleryText).find((u) => !isHttpUrl(u));
  if (badImage) e.galleryText = `Adresse invalide : « ${badImage} ».`;

  if (t(v.videoUrl) && !isHttpUrl(t(v.videoUrl)))
    e.videoUrl = 'Lien vidéo invalide : saisissez une adresse complète commençant par https://';
  if (t(v.leafletUrl) && !isHttpUrl(t(v.leafletUrl))) e.leafletUrl = 'Adresse de la notice invalide.';
  if (t(v.brochureUrl) && !isHttpUrl(t(v.brochureUrl))) e.brochureUrl = 'Adresse de la brochure invalide.';

  return e;
}

export function splitLines(value: string): string[] {
  return value
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface ContactFormValues {
  name: string;
  organization: string;
  profession: string;
  email: string;
  medicineId: string;
  message: string;
  consent: boolean;
}

export function validateContact(v: ContactFormValues): FieldErrors<keyof ContactFormValues> {
  const e: FieldErrors<keyof ContactFormValues> = {};
  if (!v.name.trim()) e.name = 'Indiquez votre nom et prénom.';
  if (!v.organization.trim()) e.organization = 'Indiquez votre établissement.';
  if (!v.profession) e.profession = 'Sélectionnez votre profession.';
  if (!isEmail(v.email)) e.email = 'Adresse e-mail invalide (exemple : nom@etablissement.fr).';
  if (v.message.trim().length < 20) e.message = 'Votre message doit comporter au moins 20 caractères.';
  if (!v.consent) e.consent = 'Votre accord est nécessaire pour traiter la demande.';
  return e;
}

export function validateSettings(v: CompanySettings): FieldErrors<keyof CompanySettings> {
  const e: FieldErrors<keyof CompanySettings> = {};
  if (!v.companyName.trim()) e.companyName = 'Le nom de l’entreprise est obligatoire.';
  if (v.email.trim() && !isEmail(v.email)) e.email = 'Adresse e-mail invalide.';
  if (!isHttpUrl(v.publicBaseUrl.trim())) e.publicBaseUrl = 'Adresse invalide : elle doit commencer par https://';
  return e;
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean);
}
