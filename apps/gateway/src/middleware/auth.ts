import type { Context, Next } from 'hono';
import { auth } from '../lib/auth';
import type { AppType, User } from '../types/hono';

export async function authMiddleware(c: Context, next: Next) {
  const session = await auth.api.getSession(c.req.raw);
  const user = session?.user as User | undefined;

  c.set("user", user);
  c.set("session", session || undefined);
  c.set("isAuthenticated", !!session);
  c.set("userId", user?.id);
  c.set("userRole", user?.role);
  c.set("isAnonymous", user?.isAnonymous || false);

  await next();
}

export async function requireAuth(c: Context, next: Next) {
  if (!c.var.isAuthenticated) {
    return c.json({ error: "Authentication required." }, 401);
  }
  await next()
}

export async function requireRealUser(c: Context<AppType>, next: Next) {
  const user = c.var.user;

  if (!user || !c.var.isAuthenticated) {
    return c.json({ error: "Please sign in to access this feature." }, 401);
  }
  if (c.var.isAnonymous) {
    return c.json(
      { error: "Please create an account to access this feature." },
      403
    );
  }

  await next();
}

export async function requireAdmin(c: Context<AppType>, next: Next) {
  const user = c.var.user;

  if (!user || !c.var.isAuthenticated) {
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
