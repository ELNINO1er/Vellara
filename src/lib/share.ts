import type { DoctorShare, FieldErrors } from '../types/catalog';
import { isEmail } from './validation';

export const SHARE_DURATIONS = [7, 30, 90] as const;
export type ShareDuration = (typeof SHARE_DURATIONS)[number];

export type ShareStatus = 'active' | 'expired' | 'revoked';

export interface ShareFormValues {
  medicineId: string;
  recipientName: string;
  recipientEmail: string;
  specialty: string;
  message: string;
  duration: ShareDuration;
}

/** Jeton aléatoire non devinable (128 bits, base64url). */
export function generateShareToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function shareStatus(share: DoctorShare, now = Date.now()): ShareStatus {
  if (share.revokedAt) return 'revoked';
  return new Date(share.expiresAt).getTime() <= now ? 'expired' : 'active';
}

export function addDays(fromIso: string, days: number): string {
  return new Date(new Date(fromIso).getTime() + days * 86_400_000).toISOString();
}

/** Lien du partage. Prototype : origine courante ; production : domaine public du catalogue. */
export function shareUrl(token: string, origin = typeof window !== 'undefined' ? window.location.origin : ''): string {
  return `${origin.replace(/\/+$/, '')}/partage/${encodeURIComponent(token)}`;
}

export function validateShare(v: ShareFormValues, publishedIds: string[]): FieldErrors<keyof ShareFormValues> {
  const e: FieldErrors<keyof ShareFormValues> = {};
  if (!v.medicineId) e.medicineId = 'Sélectionnez le médicament à partager.';
  else if (!publishedIds.includes(v.medicineId)) e.medicineId = 'Seule une fiche publiée peut être partagée.';
  if (!v.recipientName.trim()) e.recipientName = 'Indiquez le nom du médecin.';
  if (!isEmail(v.recipientEmail)) e.recipientEmail = 'Adresse e-mail invalide.';
  if (v.message.length > 1000) e.message = 'Message limité à 1 000 caractères.';
  if (!SHARE_DURATIONS.includes(v.duration)) e.duration = 'Durée de validité invalide.';
  return e;
}

/** Lien « mailto: » pré-rempli, ouvert dans la messagerie de l'utilisateur. */
export function shareMailto(opts: { to: string; recipientName: string; medicineName: string; companyName: string; url: string; message: string; expiresLabel: string }): string {
  const subject = `${opts.medicineName} — fiche de présentation (${opts.companyName})`;
  const body = [
    `${opts.recipientName},`,
    '',
    opts.message.trim() || `Veuillez trouver ci-dessous la fiche de présentation de ${opts.medicineName}.`,
    '',
    `Consulter la fiche, ses documents et sa vidéo : ${opts.url}`,
    `Lien personnel, valable jusqu’au ${opts.expiresLabel}.`,
    '',
    `— ${opts.companyName}`,
  ].join('\n');
  return `mailto:${encodeURIComponent(opts.to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
