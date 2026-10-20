import { useMemo } from 'react';
import { categoryName, laboratoryName } from '../../lib/catalog';
import { formatLongDate, formatShortDate } from '../../lib/date';
import { swatchAt, type Swatch } from '../../lib/palette';
import { parseVideoUrl, type VideoInfo } from '../../lib/video';
import { useCatalog } from '../../store/CatalogContext';
import type { Medicine } from '../../types/catalog';

export interface MedicineMeta {
  categoryName: string;
  laboratoryName: string;
  laboratoryShort: string;
  swatch: Swatch;
  video: VideoInfo | null;
  updatedLong: string;
  updatedShort: string;
}

/** Données d'affichage dérivées d'une fiche (noms, couleurs, vidéo, dates). */
export function useMedicineMeta(m: Medicine): MedicineMeta {
  const { lookups } = useCatalog();
  return useMemo(() => {
    const lab = laboratoryName(m, lookups);
    return {
      categoryName: categoryName(m, lookups),
      laboratoryName: lab,
      laboratoryShort: lab.replace(/^Laboratoires?\s+/i, ''),
      swatch: swatchAt(lookups.categories.get(m.categoryId)?.swatch),
      video: parseVideoUrl(m.videoUrl),
      updatedLong: formatLongDate(m.updatedAt),
      updatedShort: formatShortDate(m.updatedAt),
    };
  }, [m, lookups]);
}
