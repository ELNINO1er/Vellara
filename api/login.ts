import {
  checkCredentials,
  clearFailures,
  clientKey,
  createSessionCookie,
  isConfigured,
  isSecure,
  json,
  lockedFor,
  registerFailure,
} from './_lib/auth.js';

/** POST /api/login — vérifie les accès et pose un cookie de session httpOnly signé. */
export async function POST(request: Request): Promise<Response> {
  if (!isConfigured()) {
    return json({ error: 'Accès administrateur non configurés sur le serveur (ADMIN_EMAIL, ADMIN_PASSWORD_SHA256, SESSION_SECRET).' }, 503);
  }

  const key = clientKey(request);
  const wait = lockedFor(key);
  if (wait) return json({ error: `Trop de tentatives. Réessayez dans ${wait} secondes.` }, 429, { 'retry-after': String(wait) });

  let email = '';
  let password = '';
  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    email = typeof body.email === 'string' ? body.email.slice(0, 254) : '';
    password = typeof body.password === 'string' ? body.password.slice(0, 256) : '';
  } catch {
    return json({ error: 'Requête invalide.' }, 400);
  }

  if (!checkCredentials(email, password)) {
    registerFailure(key);
    // Petit délai constant pour ralentir les essais automatisés.
    await new Promise((r) => setTimeout(r, 400));
    return json({ error: 'Adresse e-mail ou mot de passe incorrect.' }, 401);
  }

  clearFailures(key);
  return json({ email: email.trim().toLowerCase(), role: 'admin' }, 200, { 'set-cookie': createSessionCookie(email.trim().toLowerCase(), isSecure(request)) });
}
