/**
 * Palette « Fiery Ocean » déclinée pour les aires thérapeutiques.
 * `ink` est la variante lisible en texte sur fond clair (contraste ≥ 4,5:1).
 */
export interface Swatch {
  base: string;
  tint: string;
  ink: string;
}

export const SWATCHES: readonly Swatch[] = [
  { base: '#780000', tint: '#F7E6E1', ink: '#780000' },
  { base: '#669BBC', tint: '#E4EEF5', ink: '#2C5E7E' },
  { base: '#C1121F', tint: '#FBE8E4', ink: '#A30F1A' },
  { base: '#003049', tint: '#E1E9EE', ink: '#003049' },
  { base: '#9C7A45', tint: '#F7EDDA', ink: '#6E5228' },
  { base: '#3E7896', tint: '#E2EDF3', ink: '#2D5C75' },
];

export function swatchAt(index: number | undefined): Swatch {
  return SWATCHES[Math.abs(index ?? 0) % SWATCHES.length];
}
