import type { ReactNode } from 'react';
import { NavLink, Navigate, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router';
import { Logo } from '../components/brand/Logo';
import { Icon, type IconName } from '../components/ui/Icon';
import { useAuth } from '../store/AuthContext';
import { useCatalog } from '../store/CatalogContext';
import { useToast } from '../store/ToastContext';
import { DemoStrip } from './PublicLayout';

/** Redirige vers l'écran de connexion (simulée) si aucune session n'est ouverte. */
export function RequireAdmin() {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) return <Navigate to="/admin/connexion" replace state={{ from: location.pathname }} />;
  return <AdminLayout />;
}

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  count?: number;
  end?: boolean;
}

function AdminLayout() {
  const { data } = useCatalog();
  const { session, signOut } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const groups: { title: string; items: NavItem[] }[] = [
    { title: 'Pilotage', items: [{ to: '/admin', label: 'Tableau de bord', icon: 'dashboard', end: true }] },
    {
      title: 'Catalogue',
      items: [
        { to: '/admin/medicaments', label: 'Médicaments', icon: 'pill', count: data.medicines.length },
        { to: '/admin/categories', label: 'Catégories', icon: 'tag', count: data.categories.length },
        { to: '/admin/laboratoires', label: 'Laboratoires', icon: 'flask', count: data.laboratories.length },
        { to: '/admin/documents', label: 'Documents et vidéos', icon: 'film' },
      ],
    },
    {
      title: 'Relation médecins',
      items: [{ to: '/admin/partages', label: 'Partages médecins', icon: 'send', count: data.shares.filter((x) => !x.revokedAt && new Date(x.expiresAt).getTime() > Date.now()).length }],
    },
    { title: 'Entreprise', items: [{ to: '/admin/parametres', label: 'Paramètres', icon: 'sliders' }] },
  ];

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium transition-colors ${
      isActive ? 'bg-cream text-bordeaux' : 'text-[#D5E4EE] hover:bg-white/8 hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <DemoStrip />
      <div className="flex flex-1 flex-wrap bg-parchment">
        <aside className="flex flex-[1_1_248px] flex-col gap-1.5 bg-navy p-4 text-[#D5E4EE] lg:px-4 lg:py-6">
          <NavLink to="/admin" end className="rounded-lg px-2 py-1" aria-label="Tableau de bord">
            <Logo name={data.settings.companyName} subtitle="Administration" inverted />
          </NavLink>
          <nav aria-label="Administration" className="mt-3 flex flex-wrap gap-0.5 lg:mt-6 lg:flex-col lg:flex-nowrap">
            {groups.map((g) => (
              <div key={g.title} className="contents lg:block">
                <p className="mt-1.5 mb-1.5 hidden px-3.5 text-[11px] font-semibold tracking-[0.16em] text-sky-300 uppercase lg:block">{g.title}</p>
                {g.items.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.end} className={itemClass}>
                    <Icon name={item.icon} size={19} />
                    {item.label}
                    {item.count !== undefined && <span className="ml-auto pl-2 font-mono text-xs opacity-85">{item.count}</span>}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
          <div className="mt-auto flex flex-wrap gap-1 pt-4 lg:flex-col lg:pt-7">
            <div className="mb-2 hidden rounded-[14px] border border-white/14 bg-white/6 px-3.5 py-3 text-[12.5px] leading-snug text-[#CFE0EB] lg:block">
              <strong className="mb-1 flex items-center gap-2 text-cream">
                <Icon name="lock" size={16} />
                Connecté
              </strong>
              <span className="block truncate">{session?.email}</span>
              <span className="text-[#9CC2DA]">Prototype : vérification côté navigateur.</span>
            </div>
            <NavLink to="/" className={itemClass({ isActive: false })}>
              <Icon name="external" size={19} />
              Voir le site public
            </NavLink>
            <button
              type="button"
              className={itemClass({ isActive: false })}
              onClick={() => {
                signOut();
                notify('Vous êtes déconnecté.');
                navigate('/');
              }}
            >
              <Icon name="logout" size={19} />
              Se déconnecter
            </button>
          </div>
        </aside>
        <main id="contenu" className="min-w-0 flex-[999_1_560px] px-4 pt-6 pb-16 sm:px-10 sm:pt-8">
          <Outlet />
        </main>
      </div>
      <ScrollRestoration />
    </div>
  );
}

/** En-tête standard des pages d'administration. */
export function AdminHeader({ title, subtitle, actions, back }: { title: string; subtitle?: string; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back}
        <h1 className="text-[clamp(32px,3.2vw,44px)] leading-none font-extrabold tracking-[-0.01em] text-navy [font-stretch:74%]">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
}
