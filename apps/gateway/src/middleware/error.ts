import type { Context, Next } from 'hono';
import { customLogger } from './logger';

export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (err: any) {
    customLogger('Error:', err);
    c.status(500);
    c.json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
}
