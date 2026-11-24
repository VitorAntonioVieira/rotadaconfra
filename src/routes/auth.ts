import { Hono } from 'hono';
import { config } from '../config';
import {
  accessCodeMiddleware,
  isValidAccessCode,
} from '../middleware/accessCode';

export const authRoutes = new Hono();

authRoutes.post('/verify', async (c) => {
  const body = await c.req.json().catch(() => null);
  const code =
    body && typeof body === 'object' && typeof body.code === 'string'
      ? body.code
      : '';

  if (!isValidAccessCode(code)) {
    return c.json(
      { valid: false, error: 'Codigo de acesso incorreto. Tente novamente.' },
      401
    );
  }

  return c.json({
    valid: true,
    spsOffice: config.spsOffice,
  });
});

authRoutes.get('/config', accessCodeMiddleware, (c) => {
  return c.json({
    spsOffice: config.spsOffice,
  });
});
