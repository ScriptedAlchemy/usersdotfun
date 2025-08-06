import type { Context, Next } from 'hono';
import { auth } from '../lib/auth';
import type { User } from '../types/hono';

export async function authMiddleware(c: Context, next: Next) {
  const session = await auth.api.getSession(c.req.raw);

  c.set("user", session?.user as User | undefined);

  await next();
}

export async function requireAuth(c: Context, next: Next) {
  if (!c.var.user) {
    return c.json({ error: "Authentication required." }, 401);
  }
  await next()
}

export async function requireRealUser(c: Context, next: Next) {
  const user = c.var.user;

  if (!user) {
    return c.json({ error: "Please sign in to access this feature." }, 401);
  }
  if (user.isAnonymous) {
    return c.json(
      { error: "Please create an account to access this feature." },
      403
    );
  }

  await next();
}

export async function requireAdmin(c: Context, next: Next) {
  const user = c.var.user;

  if (!user) {
    return c.json({ error: "Authentication required." }, 401);
  }
  if (user.banned) {
    return c.json({ error: "Your account is banned." }, 403);
  }
  // if (user.role !== "admin") {
  //   return c.json({ error: "Admin role required." }, 403);
  // }

  await next();
}
