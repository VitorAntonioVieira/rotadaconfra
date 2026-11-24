import postgres from 'postgres';
import { config } from '../config';

export const sql = postgres(config.databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export async function waitForDatabase(
  maxRetries = 15,
  delayMs = 2000
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sql`SELECT 1`;
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `[db] Tentativa ${attempt}/${maxRetries} falhou (${message}). Aguardando ${delayMs}ms...`
      );
      if (attempt === maxRetries) {
        throw error;
      }
      await Bun.sleep(delayMs);
    }
  }
}
