import { UPLOAD_LIMITS } from '../config/brand';

export type FileCheck = { ok: true; dataUrl: string; name: string; size: number } | { ok: false; error: string };

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Prototype : les fichiers sont convertis en data URL et stockés localement.
 * En production : envoi vers un stockage objet (S3, Azure Blob…) et
 * enregistrement de l'URL signée, avec analyse antivirus.
 */
export async function readImage(file: File): Promise<FileCheck> {
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) return { ok: false, error: 'Format non pris en charge : choisissez une image JPG, PNG ou WebP.' };
  if (file.size > UPLOAD_LIMITS.imageBytes) return { ok: false, error: 'Image trop lourde pour la démonstration (900 Ko maximum).' };
  return readSafe(file);
}

export async function readPdf(file: File): Promise<FileCheck> {
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return { ok: false, error: 'Seuls les fichiers PDF sont acceptés.' };
  if (file.size > UPLOAD_LIMITS.documentBytes) return { ok: false, error: 'Fichier trop lourd pour la démonstration (1,2 Mo maximum).' };
  return readSafe(file);
}

async function readSafe(file: File): Promise<FileCheck> {
  try {
    return { ok: true, dataUrl: await readAsDataUrl(file), name: file.name, size: file.size };
  } catch {
    return { ok: false, error: 'Lecture du fichier impossible. Réessayez avec un autre fichier.' };
  }
}

export function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} Ko` : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}
