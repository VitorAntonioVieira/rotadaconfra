import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { config } from './config';
import { waitForDatabase } from './db/client';
import { initDatabase } from './db/schema';
import { authRoutes } from './routes/auth';
import { geocodeRoutes } from './routes/geocode';
import { participantsRoutes } from './routes/participants';
import { requestsRoutes } from './routes/requests';
import { AppPage } from './views/app';

const app = new Hono();

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', service: 'rota-da-confra' });
});

app.route('/api/auth', authRoutes);
app.route('/api/geocode', geocodeRoutes);
app.route('/api/participants', participantsRoutes);
app.route('/api/requests', requestsRoutes);

app.use(
  '/static/*',
  serveStatic({
    root: './src/public',
    rewriteRequestPath: (path) => path.replace(/^\/static/, ''),
  })
);

app.get('/', (c) => {
  return c.html(AppPage());
});

async function start() {
  console.log('[app] Iniciando Rota da Confra...');
  await waitForDatabase();
  await initDatabase();

  const server = Bun.serve({
    port: config.port,
    fetch: app.fetch,
  });

  console.log(`[app] Servidor disponivel em http://0.0.0.0:${server.port}`);
}

start().catch((error) => {
  console.error('[app] Falha fatal na inicializacao:', error);
  process.exit(1);
});
