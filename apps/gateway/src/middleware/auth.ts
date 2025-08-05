import type { Context, Next } from 'hono';
import { auth } from '../lib/auth';
import type { User } from '../types/hono';

export async function authMiddleware(c: Context, next: Next) {
  const session = await auth.api.getSession(c.req.raw);

  if (session?.user) {
    c.set('session', session.session);
    c.set('user', session.user as User);
    c.set('isAuthenticated', true);
    c.set('userId', session.user.id);
    c.set('userRole', session.user.role || 'user');
    c.set('isAnonymous', session.user.isAnonymous || false);
  } else {
    c.set('session', null);
    c.set('user', undefined);
    c.set('isAuthenticated', false);
  }

  await next();
}

export async function requireAuth(c: Context, next: Next) {
  // if (!c.get('isAuthenticated')) {
  //   return c.json({ error: 'Authentication required. Please sign in or continue as guest.' }, 401)
  // }
  await next()
}

export async function requireRealUser(c: Context, next: Next) {
  if (!c.get('isAuthenticated')) {
    return c.json({ error: 'Please sign in to access this feature' }, 401)
  }

  if (c.get('isAnonymous')) {
    return c.json({ error: 'Please create an account to access this feature' }, 403)
  }

  await next()
}

export async function requireAdmin(c: Context, next: Next) {
  const user = c.get('user');

  if (!c.get('isAuthenticated')) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  if (user?.banned) {
    return c.json({ error: 'User is banned' }, 403)
  }

  if (user?.role !== 'admin') {
    return c.json({ error: 'Admin role required' }, 403)
  }

  await next()
}
