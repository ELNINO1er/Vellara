export type VideoKind = 'embed' | 'file' | 'link';

export interface VideoInfo {
  url: string;
  provider: string;
  kind: VideoKind;
  /** Adresse du lecteur intégré, si le fournisseur le permet. */
  embedUrl: string | null;
}

const YOUTUBE_HOSTS = ['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'];

function youtubeId(u: URL): string | null {
  if (u.hostname.endsWith('youtu.be')) return u.pathname.slice(1).split('/')[0] || null;
  if (u.pathname === '/watch') return u.searchParams.get('v');
  const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
  return m ? m[1] : null;
}

/** Analyse un lien vidéo et décide comment l'afficher sur la fiche. */
export function parseVideoUrl(raw: string | null | undefined): VideoInfo | null {
  const url = String(raw ?? '').trim();
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { url, provider: 'Lien externe', kind: 'link', embedUrl: null };
  }
  const host = u.hostname.replace(/^www\./, '');

  if (YOUTUBE_HOSTS.includes(host)) {
    const id = youtubeId(u);
    return {
      url,
      provider: 'YouTube',
      kind: id ? 'embed' : 'link',
      embedUrl: id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0` : null,
    };
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = u.pathname.match(/(\d{6,})/)?.[1];
    return {
      url,
      provider: 'Vimeo',
      kind: id ? 'embed' : 'link',
      embedUrl: id ? `https://player.vimeo.com/video/${id}?dnt=1` : null,
    };
  }
  if (host === 'dailymotion.com' || host === 'dai.ly') {
    const id = host === 'dai.ly' ? u.pathname.slice(1) : u.pathname.match(/\/video\/([^/?_]+)/)?.[1];
    return {
      url,
      provider: 'Dailymotion',
      kind: id ? 'embed' : 'link',
      embedUrl: id ? `https://geo.dailymotion.com/player.html?video=${encodeURIComponent(id)}` : null,
    };
  }
  if (/\.(mp4|webm|ogv|ogg|mov)$/i.test(u.pathname)) {
    return { url, provider: 'Fichier vidéo', kind: 'file', embedUrl: null };
  }
  return { url, provider: host, kind: 'link', embedUrl: null };
}

export function describeVideoKind(kind: VideoKind): string {
  switch (kind) {
    case 'embed':
      return 'Lecteur intégré';
    case 'file':
      return 'Lecture directe';
    default:
      return 'Bouton d’ouverture';
  }
}
