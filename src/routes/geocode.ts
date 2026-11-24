import { Hono } from 'hono';
import { searchLocations } from '../lib/nominatim';
import { accessCodeMiddleware } from '../middleware/accessCode';

export const geocodeRoutes = new Hono();

geocodeRoutes.use('*', accessCodeMiddleware);

geocodeRoutes.get('/', async (c) => {
  const q = c.req.query('q') ?? '';
  if (q.trim().length < 3) {
    return c.json({ results: [] });
  }

  try {
    const results = await searchLocations(q);
    return c.json({ results });
  } catch (error) {
    console.error('[geocode] Erro ao consultar Nominatim:', error);
    return c.json(
      {
        results: [],
        error:
          'Nao foi possivel buscar a localizacao no momento. Tente novamente em instantes.',
      },
      502
    );
  }
});
