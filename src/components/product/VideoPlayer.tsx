import { useState } from 'react';
import type { VideoInfo } from '../../lib/video';
import { buttonClasses } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Capsule } from '../brand/Capsule';

/**
 * Lecteur vidéo de la fiche :
 * - fournisseur intégrable (YouTube, Vimeo, Dailymotion) → lecteur intégré,
 *   chargé seulement au clic (aucun contenu tiers avant l'action de l'utilisateur) ;
 * - fichier vidéo direct → balise <video> ;
 * - autre lien → bouton d'ouverture dans un nouvel onglet.
 */
export function VideoPlayer({ video, title }: { video: VideoInfo; title: string }) {
  const [activated, setActivated] = useState(false);
  const [fileFailed, setFileFailed] = useState(false);

  const frame = 'relative grid aspect-video place-items-center overflow-hidden rounded-[26px] bg-navy text-white';

  if (video.kind === 'embed' && video.embedUrl) {
    if (activated) {
      const src = new URL(video.embedUrl);
      src.searchParams.set('autoplay', '1');
      // YouTube exige d'identifier le site intégrant (sinon « erreur 153 »).
      if (video.provider === 'YouTube') src.searchParams.set('origin', window.location.origin);
      return (
        <div className={frame}>
          <iframe
            src={src.toString()}
            title={`Vidéo de présentation — ${title}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      );
    }
    return (
      <div className={frame}>
        <Capsule left="#780000" right="#C1121F" className="absolute -bottom-[6%] -left-[8%] h-[22%] w-[46%] opacity-55" angle={-24} />
        <div className="relative flex flex-col items-center gap-4 p-6 text-center">
          <button
            type="button"
            onClick={() => setActivated(true)}
            aria-label={`Lire la vidéo de présentation de ${title}`}
            className="grid size-[92px] place-items-center rounded-full bg-ember text-white shadow-[0_0_0_10px_rgba(193,18,31,.18)] transition-transform duration-300 hover:scale-105 hover:bg-ember-dark"
          >
            <Icon name="play" size={34} className="ml-1" />
          </button>
          <span className="text-xs font-semibold tracking-[0.16em] text-sky-300 uppercase">Lecteur {video.provider}</span>
          <span className="max-w-[36ch] text-[13px] text-white/70">Le lecteur {video.provider} est chargé uniquement lorsque vous lancez la lecture.</span>
        </div>
      </div>
    );
  }

  if (video.kind === 'file' && !fileFailed) {
    return (
      <div className={frame}>
        <video controls preload="metadata" src={video.url} onError={() => setFileFailed(true)} className="absolute inset-0 h-full w-full bg-black">
          <track kind="captions" />
        </video>
      </div>
    );
  }

  return (
    <div className={frame}>
      <Capsule left="#003049" right="#669BBC" className="absolute -bottom-[6%] -left-[8%] h-[22%] w-[46%] opacity-55" angle={-24} />
      <div className="relative flex flex-col items-center gap-4 p-6 text-center">
        <span className="text-xs font-semibold tracking-[0.16em] text-sky-300 uppercase">
          {fileFailed ? 'Lecture intégrée indisponible' : `Vidéo hébergée sur ${video.provider}`}
        </span>
        <a href={video.url} target="_blank" rel="noopener noreferrer" className={buttonClasses('cream', 'lg')}>
          <Icon name="play" size={18} />
          Ouvrir la vidéo
          <span className="sr-only"> (nouvel onglet)</span>
        </a>
      </div>
    </div>
  );
}
