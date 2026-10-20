import { clearSessionCookie, isSecure, json } from './_lib/auth.js';

/** POST /api/logout — supprime le cookie de session. */
export function POST(request: Request): Response {
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie(isSecure(request)) });
}
