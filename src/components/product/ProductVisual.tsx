import { useState } from 'react';
import type { Swatch } from '../../lib/palette';

interface PackProps {
  name: string;
  substance?: string;
  strength?: string;
  laboratory?: string;
  swatch: Swatch;
  className?: string;
}

/**
 * Étui de médicament généré à partir de la fiche.
 * Sert de visuel par défaut et de remplacement quand une image est indisponible.
 */
export function GeneratedPack({ name, substance, strength, laboratory, swatch, className = '' }: PackProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative flex aspect-[1.5/1] w-full flex-col overflow-hidden rounded-[9px] bg-white shadow-[0_1px_0_rgba(0,48,73,.06),0_18px_34px_-20px_rgba(0,48,73,.5)] [container-type:inline-size] ${className}`}
    >
      <div className="flex h-[15%] items-center justify-end px-[6%]" style={{ background: swatch.base }}>
        <span className="block h-[38%] w-[16%] rounded-full bg-white/85" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-end gap-px pt-[6%] pr-[14%] pb-[7%] pl-[8%]">
        {laboratory && (
          <span className="truncate text-[clamp(7px,4.2cqw,12px)] font-semibold tracking-[0.16em] text-muted uppercase">{laboratory}</span>
        )}
        <span className="truncate text-[clamp(14px,14cqw,46px)] leading-[0.98] font-extrabold tracking-[-0.01em] text-navy [font-stretch:68%]">
          {name || 'Nom'}
        </span>
        {substance && <span className="truncate text-[clamp(8px,5cqw,15px)] text-ink-soft">{substance}</span>}
        {strength && (
          <span className="mt-[3%] font-mono text-[clamp(8px,5.2cqw,16px)] font-semibold" style={{ color: swatch.ink }}>
            {strength}
          </span>
        )}
      </div>
      <div className="absolute top-[15%] right-0 bottom-0 w-[6%]" style={{ background: swatch.base }} />
    </div>
  );
}

interface ProductMediaProps extends PackProps {
  image: string | null;
  alt: string;
  fit?: 'cover' | 'contain';
  padding?: string;
}

/** Photo du produit, avec repli automatique sur l'étui généré si l'image échoue. */
export function ProductMedia({ image, alt, fit = 'cover', padding = 'px-[15%]', ...pack }: ProductMediaProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = !!image && failed !== image;
  return (
    <div className={`relative grid h-full w-full place-items-center ${showImage ? '' : padding}`} style={{ background: pack.swatch.tint }}>
      {showImage ? (
        <img
          src={image}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(image)}
          className={`absolute inset-0 h-full w-full ${fit === 'cover' ? 'object-cover' : 'bg-white object-contain'}`}
        />
      ) : (
        <GeneratedPack {...pack} />
      )}
    </div>
  );
}
