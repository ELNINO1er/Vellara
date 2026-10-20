import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Authentification côté serveur (fonctions Vercel).
 * Variables d'environnement — à définir dans Vercel › Settings › Environment Variables
 * (et dans .env.local pour le développement) ; JAMAIS préfixées VITE_ :
 *   ADMIN_EMAIL            adresse de l'administrateur
 *   ADMIN_PASSWORD_SHA256  empreinte SHA-256 (hex) du mot de passe
 *   SESSION_SECRET         clé aléatoire (≥ 32 caractères) qui signe le cookie de session
 */

export const COOKIE_NAME = 'vellara_session';
const SESSION_TTL_S = 8 * 60 * 60; // 8 heures

interface SessionPayload {
  email: string;
  role: 'admin';
  exp: number;
}

function env() {
  return {
    email: (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase(),
    hash: (process.env.ADMIN_PASSWORD_SHA256 ?? '').trim().toLowerCase(),
    secret: process.env.SESSION_SECRET ?? '',
  };
}

export function isConfigured(): boolean {
  const e = env();
  return !!e.email && /^[a-f0-9]{64}$/.test(e.hash) && e.secret.length >= 32;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function checkCredentials(email: string, password: string): boolean {
  const e = env();
  const hash = createHash('sha256').update(password).digest('hex');
  // Les deux comparaisons sont toujours évaluées (pas de court-circuit révélateur).
  const emailOk = safeEqual(email.trim().toLowerCase(), e.email);
  const passOk = safeEqual(hash, e.hash);
  return emailOk && passOk;
}

function sign(data: string): string {
  return createHmac('sha256', env().secret).update(data).digest('base64url');
}

export function createSessionCookie(email: string, secure: boolean): string {
  const payload: SessionPayload = { email, role: 'admin', exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return serializeCookie(`${data}.${sign(data)}`, SESSION_TTL_S, secure);
}

export function clearSessionCookie(secure: boolean): string {
  return serializeCookie('', 0, secure);
}

function serializeCookie(value: string, maxAge: number, secure: boolean): string {
  return [`${COOKIE_NAME}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAge}`, secure ? 'Secure' : ''].filter(Boolean).join('; ');
}

export function readSession(request: Request): SessionPayload | null {
  if (!isConfigured()) return null;
  const cookie = request.headers.get('cookie') ?? '';
  const raw = cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!raw) return null;
  const [data, signature] = raw.split('.');
  if (!data || !signature || !safeEqual(signature, sign(data))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload;
    if (payload.exp < Date.now() / 1000 || payload.email !== env().email) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isSecure(request: Request): boolean {
  return new URL(request.url).protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

/* ——— Limitation des tentatives (par instance ; en production, préférer un stockage partagé type Redis) ——— */
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;

export function clientKey(request: Request): string {
  return (request.headers.get('x-forwarded-for') ?? 'local').split(',')[0].trim();
}

export function lockedFor(key: string): number {
  const a = attempts.get(key);
  return a && a.until > Date.now() ? Math.ceil((a.until - Date.now()) / 1000) : 0;
}

export function registerFailure(key: string): void {
  const a = attempts.get(key) ?? { count: 0, until: 0 };
  a.count += 1;
  if (a.count >= MAX_ATTEMPTS) {
    a.until = Date.now() + LOCK_MS;
    a.count = 0;
  }
  attempts.set(key, a);
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}
