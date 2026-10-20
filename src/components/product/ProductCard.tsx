import { Link } from 'react-router';
import type { Medicine } from '../../types/catalog';
import { Icon } from '../ui/Icon';
import { ProductMedia } from './ProductVisual';
import { useMedicineMeta } from './useMedicineMeta';

function VideoBadge() {
  return (
    <span className="absolute top-3 left-3 z-[1] inline-flex items-center gap-1 rounded-full bg-navy py-1 pr-3 pl-2 text-xs font-semibold text-white">
      <Icon name="play" size={14} />
      Vidéo
    </span>
  );
}

function DemoTag() {
  return (
    <span className="absolute top-3 right-3 z-[1] rounded-full bg-white/90 px-2 py-1 text-[10.5px] font-semibold tracking-[0.12em] text-muted uppercase">
      Démo
    </span>
  );
}

/** Carte produit (grille). Toute la carte est cliquable via le lien du titre. */
export function ProductCard({ medicine }: { medicine: Medicine }) {
  const meta = useMedicineMeta(medicine);
  return (
    <article className="group animate-rise relative flex flex-col overflow-hidden rounded-[22px] border border-sand-200 bg-white transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-sand-300 hover:shadow-[0_22px_44px_-30px_rgba(0,48,73,.6)] focus-within:border-sky">
      <div className="relative aspect-[4/3] [&_[aria-hidden]]:transition-transform [&_[aria-hidden]]:duration-500 group-hover:[&_[aria-hidden]]:-rotate-2 group-hover:[&_[aria-hidden]]:scale-[1.03]">
        <ProductMedia
          image={medicine.image}
          alt=""
          name={medicine.name}
          substance={medicine.activeSubstance}
          strength={medicine.strength}
          laboratory={meta.laboratoryShort}
          swatch={meta.swatch}
        />
        {meta.video && <VideoBadge />}
        <DemoTag />
      </div>
      <div className="flex flex-1 flex-col px-5 pt-[18px] pb-[18px]">
        <p className="mb-1.5 text-[11.5px] font-semibold tracking-[0.14em] uppercase" style={{ color: meta.swatch.ink }}>
          {meta.categoryName}
        </p>
        <h3 className="text-[26px] leading-[1.05] font-bold text-navy [font-stretch:78%]">
          <Link
            to={`/catalogue/${medicine.slug}`}
            className="after:absolute after:inset-0 after:z-[2] after:rounded-[22px] focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-offset-[-3px] focus-visible:after:outline-sky"
          >
            {medicine.name}
          </Link>
        </h3>
        <p className="mt-0.5 text-[15px] text-ink-soft">{medicine.activeSubstance}</p>
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <span className="chip font-mono">{medicine.strength}</span>
          <span className="chip">{medicine.dosageForm}</span>
        </div>
        <p className="mt-auto pt-3.5 text-[13px] text-muted">
          <span className="block border-t border-dashed border-sand-300 pt-3">{meta.laboratoryName}</span>
        </p>
      </div>
    </article>
  );
}

/** Ligne produit (affichage liste). */
export function ProductRow({ medicine }: { medicine: Medicine }) {
  const meta = useMedicineMeta(medicine);
  return (
    <article className="animate-rise relative grid grid-cols-[84px_minmax(0,1fr)] items-center gap-5 rounded-[18px] border border-sand-200 bg-white py-2.5 pr-[18px] pl-2.5 transition-[border-color,box-shadow] hover:border-sand-300 hover:shadow-[0_14px_30px_-26px_rgba(0,48,73,.6)] md:grid-cols-[104px_minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_110px]">
      <div className="aspect-[1.25/1] overflow-hidden rounded-xl">
        <ProductMedia image={medicine.image} alt="" name={medicine.name} strength={medicine.strength} laboratory={meta.laboratoryShort} swatch={meta.swatch} padding="px-2.5" />
      </div>
      <div className="min-w-0">
        <h3 className="text-[21px] leading-[1.1] font-bold text-navy [font-stretch:80%]">
          <Link to={`/catalogue/${medicine.slug}`} className="after:absolute after:inset-0 after:rounded-[18px] focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-sky">
            {medicine.name}
          </Link>
        </h3>
        <p className="text-sm text-ink-soft">
          {medicine.activeSubstance} · <span className="font-mono">{medicine.strength}</span>
        </p>
      </div>
      <p className="hidden text-sm text-ink md:block">
        <small className="block text-[11.5px] font-semibold tracking-[0.12em] text-muted uppercase">Forme</small>
        {medicine.dosageForm}
      </p>
      <p className="hidden text-sm text-ink md:block">
        <small className="block text-[11.5px] font-semibold tracking-[0.12em] uppercase" style={{ color: meta.swatch.ink }}>
          {meta.categoryName}
        </small>
        {meta.laboratoryName}
      </p>
      <div className="hidden items-center justify-end gap-2 text-[13px] font-semibold text-navy md:flex">
        {meta.video && (
          <span className="inline-flex items-center gap-1.5">
            <Icon name="play" size={16} className="text-ember" />
            Vidéo
          </span>
        )}
        <Icon name="arrowRight" className="text-bordeaux" />
      </div>
    </article>
  );
}
