import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * ⚠️ AUTHENTIFICATION DE DÉMONSTRATION — vérifiée dans le navigateur.
 * Les accès sont lus dans `.env.local` (VITE_ADMIN_EMAIL, VITE_ADMIN_PASSWORD_SHA256) ;
 * seule l'empreinte SHA-256 du mot de passe est conservée, jamais le mot de passe en clair.
 * Cela reste contournable par quiconque inspecte le code : en production, la vérification
 * doit se faire côté serveur (session httpOnly, rôles contrôlés par l'API, MFA).
 */

export type Role = 'admin';

interface Session {
  email: string;
  role: Role;
}

export type SignInResult = { ok: true } | { ok: false; error: string };

interface AuthApi {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => void;
}

const SESSION_KEY = 'vellara.session';
const MAX_ATTEMPTS = 5;
const LOCK_MS = 30_000;

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? '').trim().toLowerCase();
const ADMIN_HASH = (import.meta.env.VITE_ADMIN_PASSWORD_SHA256 ?? '').trim().toLowerCase();

export const authConfigured = !!ADMIN_EMAIL && /^[a-f0-9]{64}$/.test(ADMIN_HASH);

async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Comparaison en temps constant (évite de révéler la position de la première différence). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readSession(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s.email === ADMIN_EMAIL ? s : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);
  const [failures, setFailures] = useState({ count: 0, lockedUntil: 0 });

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      if (!authConfigured)
        return { ok: false, error: 'Accès non configurés : renseignez VITE_ADMIN_EMAIL et VITE_ADMIN_PASSWORD_SHA256 dans .env.local.' };

      const now = Date.now();
      if (failures.lockedUntil > now) {
        const s = Math.ceil((failures.lockedUntil - now) / 1000);
        return { ok: false, error: `Trop de tentatives. Réessayez dans ${s} seconde${s > 1 ? 's' : ''}.` };
      }

      const valid = email.trim().toLowerCase() === ADMIN_EMAIL && safeEqual(await sha256(password), ADMIN_HASH);
      if (!valid) {
        const count = failures.count + 1;
        const locked = count >= MAX_ATTEMPTS;
        setFailures({ count: locked ? 0 : count, lockedUntil: locked ? now + LOCK_MS : 0 });
        return {
          ok: false,
          error: locked ? 'Trop de tentatives. Accès bloqué pendant 30 secondes.' : 'Adresse e-mail ou mot de passe incorrect.',
        };
      }

      const next: Session = { email: ADMIN_EMAIL, role: 'admin' };
      try {
        // sessionStorage : la session se ferme avec l'onglet.
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      } catch {
        /* session en mémoire uniquement */
      }
      setFailures({ count: 0, lockedUntil: 0 });
      setSession(next);
      return { ok: true };
    },
    [failures],
  );

  const signOut = useCallback(() => {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* rien à nettoyer */
    }
    setSession(null);
  }, []);

  const api = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
