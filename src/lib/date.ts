const parse = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);

export function nowIso(): string {
  return new Date().toISOString();
}

export function formatLongDate(iso: string): string {
  const date = parse(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatShortDate(iso: string): string {
  const date = parse(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR');
}
