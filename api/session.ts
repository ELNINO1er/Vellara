import { isConfigured, json, readSession } from './_lib/auth.js';

/** GET /api/session — renvoie la session en cours (cookie signé) ou 401. */
export function GET(request: Request): Response {
  const session = readSession(request);
  if (!session) return json({ configured: isConfigured() }, 401);
  return json({ email: session.email, role: session.role });
}
