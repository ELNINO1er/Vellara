import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * En développement, sert les fonctions de /api (format Vercel : export GET/POST(request))
 * pour que `npm run dev` se comporte comme le déploiement.
 */
function vercelApiInDev(): Plugin {
  return {
    name: 'vercel-api-dev',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api', async (req: IncomingMessage & { originalUrl?: string }, res: ServerResponse, next: () => void) => {
        const name = (req.url ?? '/').split('?')[0].replace(/^\/+|\/+$/g, '');
        if (!/^[a-z-]+$/.test(name)) return next();
        try {
          const mod = (await server.ssrLoadModule(`/api/${name}.ts`)) as Record<string, (r: Request) => Response | Promise<Response>>;
          const handler = mod[req.method ?? 'GET'];
          if (typeof handler !== 'function') {
            res.statusCode = 405;
            return res.end();
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const headers = new Headers();
          Object.entries(req.headers).forEach(([k, v]) => v !== undefined && headers.set(k, Array.isArray(v) ? v.join(', ') : v));
          const request = new Request(`http://${req.headers.host}${req.originalUrl ?? req.url}`, {
            method: req.method,
            headers,
            body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : Buffer.concat(chunks),
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          server.ssrFixStacktrace(error as Error);
          console.error(error);
          res.statusCode = 500;
          res.end('Erreur serveur');
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Variables serveur (sans préfixe VITE_) exposées aux fonctions /api en développement uniquement.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return {
    plugins: [react(), tailwindcss(), vercelApiInDev()],
    server: { port: 5180 },
  };
});
