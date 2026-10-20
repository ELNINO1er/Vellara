import { describe, expect, it } from 'vitest';
import { addDays, generateShareToken, shareMailto, shareStatus, shareUrl, validateShare } from './share';
import type { DoctorShare } from '../types/catalog';

const base: DoctorShare = {
  id: 's1', token: 'tok', medicineId: 'm1', recipientName: 'Dr Test', recipientEmail: 'dr@exemple.fr', specialty: '',
  message: '', createdAt: '2026-10-01T00:00:00.000Z', expiresAt: '2026-10-31T00:00:00.000Z', views: 0, lastViewedAt: null, revokedAt: null,
};

describe('partage médecin', () => {
  it('jetons aléatoires, uniques et utilisables dans une URL', () => {
    const a = generateShareToken(), b = generateShareToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{20,}$/);
  });
  it('statut actif, expiré, désactivé', () => {
    const now = new Date('2026-10-15').getTime();
    expect(shareStatus(base, now)).toBe('active');
    expect(shareStatus(base, new Date('2026-11-01').getTime())).toBe('expired');
    expect(shareStatus({ ...base, revokedAt: '2026-10-02' }, now)).toBe('revoked');
  });
  it('calcule l’expiration', () => {
    expect(addDays('2026-10-01T00:00:00.000Z', 30)).toBe('2026-10-31T00:00:00.000Z');
  });
  it('refuse une fiche non publiée et un e-mail invalide', () => {
    const e = validateShare({ medicineId: 'brouillon', recipientName: '', recipientEmail: 'x', specialty: '', message: '', duration: 30 }, ['m1']);
    expect(Object.keys(e).sort()).toEqual(['medicineId', 'recipientEmail', 'recipientName']);
  });
  it('construit le lien et l’e-mail prérempli', () => {
    expect(shareUrl('abc', 'https://site.fr/')).toBe('https://site.fr/partage/abc');
    const m = shareMailto({ to: 'dr@exemple.fr', recipientName: 'Dr Test', medicineName: 'Cardivel', companyName: 'Vellara', url: 'https://site.fr/partage/abc', message: 'Bonjour', expiresLabel: '31 octobre 2026' });
    expect(m.startsWith('mailto:dr%40exemple.fr?subject=')).toBe(true);
    expect(decodeURIComponent(m)).toContain('https://site.fr/partage/abc');
  });
});
