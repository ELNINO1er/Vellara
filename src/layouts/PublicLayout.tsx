import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { Logo } from '../components/brand/Logo';
import { ButtonLink } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { useCatalog } from '../store/CatalogContext';

const NAV = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/catalogue', label: 'Catalogue', end: false },
  { to: '/contact', label: 'Contact', end: false },
];

export function DemoStrip() {
  return (
    <div className="bg-navy-deep text-[13px] text-[#D5E4EE]">
      <div className="container-page flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-[7px]">
        <span>
          <span className="mr-2 inline-block size-[7px] rounded-full bg-ember align-[1px]" aria-hidden="true" />
          <strong className="font-semibold text-cream">Prototype de démonstration</strong> · produits fictifs, aucune donnée médicale réelle
        </span>
        <span className="hidden sm:inline">Données conservées dans ce navigateur uniquement</span>
      </div>
    </div>
  );
}

export function PublicLayout() {
  const { data } = useCatalog();
  const { settings } = data;
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center rounded-full px-4 font-medium transition-colors ${
      isActive ? 'bg-cream text-bordeaux' : 'text-ink hover:bg-sand-100'
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenu" className="sr-only z-50 rounded-lg bg-navy px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Aller au contenu
      </a>
      <DemoStrip />
      <header className="sticky top-0 z-30 border-b border-sand-200 bg-ivory/95 backdrop-blur-sm">
        <div className="container-page flex min-h-[78px] items-center gap-6 py-2.5">
          <Link to="/" aria-label={`Accueil — ${settings.companyName}`} className="rounded-lg">
            <Logo name={settings.companyName} subtitle={settings.tagline} />
          </Link>
          <nav aria-label="Navigation principale" className="ml-auto hidden items-center gap-0.5 md:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
                {n.label}
              </NavLink>
            ))}
            <ButtonLink to="/admin" variant="navy" icon="lock" className="ml-2">
              Administration
            </ButtonLink>
          </nav>
          <button
            type="button"
            className="ml-auto grid size-11 place-items-center rounded-xl text-navy hover:bg-sand-100 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
        {menuOpen && (
          <nav id="menu-mobile" aria-label="Navigation principale" className="animate-fade container-page flex flex-col gap-1 pb-4 md:hidden">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
                {n.label}
              </NavLink>
            ))}
            <ButtonLink to="/admin" variant="navy" icon="lock" className="mt-2">
              Administration
            </ButtonLink>
          </nav>
        )}
      </header>

      <main id="contenu" className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-navy-deep pt-14 pb-9 text-[#B9CDDA]">
        <div className="container-page">
          <div className="flex flex-wrap justify-between gap-x-16 gap-y-8">
            <Logo name={settings.companyName} subtitle={settings.tagline} inverted />
            <nav aria-label="Pied de page" className="flex flex-wrap gap-x-2 gap-y-1">
              {[...NAV, { to: '/admin', label: 'Administration', end: false }].map((n) => (
                <Link key={n.to} to={n.to} className="px-2 py-2.5 text-[14.5px] text-[#DCE8F0] hover:text-white hover:underline">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="mt-9 border-t border-white/12 pt-5 text-[13px] leading-relaxed text-[#9FB6C5]">
            Prototype de démonstration. Les produits, substances, laboratoires et documents présentés sont fictifs. Aucune information de cette
            plateforme ne constitue une recommandation médicale, une posologie ou une autorisation réglementaire. © {new Date().getFullYear()}{' '}
            {settings.companyName} — nom provisoire.
          </p>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
