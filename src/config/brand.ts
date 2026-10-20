/**
 * Valeurs par défaut de l'identité. Le nom affiché est modifiable à chaud
 * depuis Administration › Paramètres ; ces valeurs servent au premier lancement
 * et à la réinitialisation des données de démonstration.
 */
export const BRAND_DEFAULTS = {
  companyName: 'Vellara Pharma',
  tagline: 'Catalogue professionnel',
  intro:
    'Retrouvez l’ensemble de nos spécialités dans un catalogue de référence : fiches produits structurées, documents validés et présentations vidéo, réunis pour les professionnels de santé.',
  email: 'contact@vellara-pharma.example',
  phone: '+33 (0)1 00 00 00 00',
  address: '[Adresse du siège à renseigner]',
  publicBaseUrl: 'https://catalogue.vellara-pharma.example',
} as const;

/** Mention affichée tant qu'une rubrique médicale n'est pas renseignée. */
export const MEDICAL_PLACEHOLDER = 'À renseigner à partir de la documentation validée.';

export const DOSAGE_FORMS = [
  'Comprimé',
  'Comprimé pelliculé',
  'Comprimé orodispersible',
  'Gélule',
  'Solution buvable',
  'Sirop',
  'Poudre pour suspension buvable',
  'Suspension pour inhalation',
  'Crème',
  'Pommade',
  'Collyre',
  'Solution injectable',
] as const;

export const PROFESSIONS = [
  'Médecin',
  'Pharmacien·ne',
  'Infirmier·ère',
  'Établissement de santé',
  'Autre professionnel de santé',
] as const;

export const UPLOAD_LIMITS = {
  imageBytes: 900 * 1024,
  documentBytes: 1.2 * 1024 * 1024,
} as const;
