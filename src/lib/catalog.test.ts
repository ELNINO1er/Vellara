import { describe, expect, it } from 'vitest';
import { createSeedData } from '../data/seed';
import { buildLookups, DEFAULT_FILTERS, filterCatalog, isPublished, shareLink } from './catalog';
import { contentFromDraft, draftFromMedicine, emptyDraft } from './medicineForm';
import { normalize, uniqueSlug } from './text';
import { validateContact, validateMedicine } from './validation';
import { parseVideoUrl } from './video';

const data = createSeedData();
const lookups = buildLookups(data);
const published = data.medicines.filter(isPublished);

describe('catalogue public', () => {
  it('ne montre que les fiches publiées', () => {
    expect(published).toHaveLength(8);
  });

  it('recherche par substance active sans accents', () => {
    const r = filterCatalog(published, { ...DEFAULT_FILTERS, q: 'cefaludine' }, lookups);
    expect(r.map((m) => m.name)).toEqual(['Infexil']);
  });

  it('recherche par laboratoire', () => {
    const r = filterCatalog(published, { ...DEFAULT_FILTERS, q: 'nordis' }, lookups);
    expect(r.every((m) => m.laboratoryId === 'nordis')).toBe(true);
    expect(r.length).toBeGreaterThan(0);
  });

  it('combine catégorie et présence de vidéo', () => {
    const r = filterCatalog(published, { ...DEFAULT_FILTERS, category: 'pneumo', video: 'with' }, lookups);
    expect(r.map((m) => m.name)).toEqual(['Respilane']);
  });

  it('trie par nom en français', () => {
    const r = filterCatalog(published, DEFAULT_FILTERS, lookups);
    expect(r[0].name).toBe('Bronchilis');
  });

  it('construit le lien de partage', () => {
    expect(shareLink('https://exemple.fr/', { slug: 'cardivel' })).toBe('https://exemple.fr/catalogue/cardivel');
  });
});

describe('validation des fiches', () => {
  it('un brouillon ne demande que le nom', () => {
    const d = emptyDraft();
    d.values.name = 'Nouveau';
    expect(validateMedicine(d.values, { publish: false, takenNames: [] })).toEqual({});
  });

  it('la publication exige les champs obligatoires', () => {
    const d = emptyDraft();
    d.values.name = 'Nouveau';
    const e = validateMedicine(d.values, { publish: true, takenNames: [] });
    expect(Object.keys(e).sort()).toEqual(['activeSubstance', 'categoryId', 'description', 'dosageForm', 'laboratoryId', 'packaging', 'source', 'strength']);
  });

  it('refuse un nom déjà utilisé et un lien vidéo invalide', () => {
    const d = emptyDraft();
    d.values.name = 'cardivel';
    d.values.videoUrl = 'pas un lien';
    const e = validateMedicine(d.values, { publish: false, takenNames: ['Cardivel'] });
    expect(e.name).toBeTruthy();
    expect(e.videoUrl).toBeTruthy();
  });

  it('aller-retour fiche ↔ formulaire sans perte', () => {
    const m = data.medicines[0];
    const content = contentFromDraft(draftFromMedicine(m));
    expect(content.name).toBe(m.name);
    expect(content.leaflet).toEqual(m.leaflet);
    expect(content.videoUrl).toBe(m.videoUrl);
  });

  it('valide le formulaire de contact', () => {
    const e = validateContact({ name: '', organization: 'CHU', profession: 'Médecin', email: 'faux', medicineId: '', message: 'court', consent: false });
    expect(Object.keys(e).sort()).toEqual(['consent', 'email', 'message', 'name']);
  });
});

describe('vidéo', () => {
  it('YouTube → lecteur intégré sans cookies', () => {
    const v = parseVideoUrl('https://www.youtube.com/watch?v=abc123');
    expect(v?.kind).toBe('embed');
    expect(v?.embedUrl).toContain('youtube-nocookie.com/embed/abc123');
  });
  it('youtu.be et Vimeo', () => {
    expect(parseVideoUrl('https://youtu.be/xyz')?.embedUrl).toContain('/embed/xyz');
    expect(parseVideoUrl('https://vimeo.com/123456789')?.embedUrl).toBe('https://player.vimeo.com/video/123456789?dnt=1');
  });
  it('fichier direct et lien quelconque', () => {
    expect(parseVideoUrl('https://cdn.exemple.fr/film.mp4')?.kind).toBe('file');
    expect(parseVideoUrl('https://exemple.fr/page')?.kind).toBe('link');
    expect(parseVideoUrl('')).toBeNull();
  });
});

describe('texte', () => {
  it('normalise et génère des slugs uniques', () => {
    expect(normalize('Gastrélia')).toBe('gastrelia');
    expect(uniqueSlug('Gastrélia', ['gastrelia', 'gastrelia-2'])).toBe('gastrelia-3');
  });
});
