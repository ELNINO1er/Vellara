import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { checkCredentials, createSessionCookie, readSession } from './auth';

const PASSWORD = 'MotDePasseDeTest-123';

beforeEach(() => {
  process.env.ADMIN_EMAIL = 'admin@exemple.fr';
  process.env.ADMIN_PASSWORD_SHA256 = createHash('sha256').update(PASSWORD).digest('hex');
  process.env.SESSION_SECRET = 'x'.repeat(48);
});

const requestWith = (cookie: string) => new Request('https://site.fr/api/session', { headers: { cookie } });
const cookieValue = (setCookie: string) => setCookie.split(';')[0];

describe('authentification serveur', () => {
  it('accepte les bons accès (e-mail insensible à la casse)', () => {
    expect(checkCredentials('Admin@Exemple.fr ', PASSWORD)).toBe(true);
  });

  it('refuse un mauvais mot de passe ou un autre e-mail', () => {
    expect(checkCredentials('admin@exemple.fr', 'faux')).toBe(false);
    expect(checkCredentials('autre@exemple.fr', PASSWORD)).toBe(false);
  });

  it('le cookie est httpOnly, Secure, SameSite=Strict', () => {
    const c = createSessionCookie('admin@exemple.fr', true);
    expect(c).toContain('HttpOnly');
    expect(c).toContain('Secure');
    expect(c).toContain('SameSite=Strict');
  });

  it('une session signée est reconnue', () => {
    const c = cookieValue(createSessionCookie('admin@exemple.fr', true));
    expect(readSession(requestWith(c))?.email).toBe('admin@exemple.fr');
  });

  it('un cookie falsifié est rejeté', () => {
    const [name, value] = cookieValue(createSessionCookie('admin@exemple.fr', true)).split('=');
    const [data] = value.split('.');
    expect(readSession(requestWith(`${name}=${data}.signaturebidon`))).toBeNull();
    const forged = Buffer.from(JSON.stringify({ email: 'admin@exemple.fr', role: 'admin', exp: 9e9 })).toString('base64url');
    expect(readSession(requestWith(`${name}=${forged}.${value.split('.')[1]}`))).toBeNull();
  });

  it('changer la clé de session invalide les sessions existantes', () => {
    const c = cookieValue(createSessionCookie('admin@exemple.fr', true));
    process.env.SESSION_SECRET = 'y'.repeat(48);
    expect(readSession(requestWith(c))).toBeNull();
  });
});
