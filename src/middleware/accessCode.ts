import type { MiddlewareHandler } from 'hono';
import { config } from '../config';

export function isValidAccessCode(code: string | undefined | null): boolean {
  if (!code) return false;
  return code.trim().toLowerCase() === config.accessCode.toLowerCase();
}

export const accessCodeMiddleware: MiddlewareHandler = async (c, next) => {
  const headerCode = c.req.header('x-access-code');
  if (!isValidAccessCode(headerCode)) {
    return c.json(
      { error: 'Codigo de acesso invalido ou nao informado.' },
      401
    );
  }
  await next();
};
