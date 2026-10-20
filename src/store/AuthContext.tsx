import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Session administrateur vérifiée CÔTÉ SERVEUR (fonctions /api) :
 * les accès ne sont jamais envoyés au navigateur ; la session est un cookie
 * httpOnly signé, illisible par le JavaScript de la page.
 */

export type Role = 'admin';

interface Session {
  email: string;
  role: Role;
}

export type SignInResult = { ok: true } | { ok: false; error: string };

interface AuthApi {
  session: Session | null;
  /** true tant que la session n'a pas été vérifiée auprès du serveur. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthApi | null>(null);

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    /* corps non JSON */
  }
  return response.status >= 500 ? 'Service de connexion indisponible. Réessayez plus tard.' : 'Connexion impossible.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/session', { credentials: 'same-origin' })
      .then(async (r) => (r.ok ? ((await r.json()) as Session) : null))
      .catch(() => null)
      .then((s) => {
        if (!cancelled) {
          setSession(s);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) return { ok: false, error: await readError(response) };
      setSession((await response.json()) as Session);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Serveur injoignable. Vérifiez votre connexion.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    } finally {
      setSession(null);
    }
  }, []);

  const api = useMemo(() => ({ session, loading, signIn, signOut }), [session, loading, signIn, signOut]);
  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
