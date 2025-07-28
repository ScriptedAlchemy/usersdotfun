import { auth } from '../lib/auth'
import type { Context, Next } from 'hono'

export async function authMiddleware(c: Context, next: Next) {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers
    })
    
    if (session?.session && session?.user) {
      c.set('session', session.session)
      c.set('user', session.user)
      c.set('isAuthenticated', true)
    } else {
      c.set('isAuthenticated', false)
    }
  } catch (error) {
    console.error('Session validation error:', error)
    c.set('isAuthenticated', false)
  }
  
  await next()
}

export async function requireAuth(c: Context, next: Next) {
  if (!c.get('isAuthenticated')) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  await next()
}

export async function requireAdmin(c: Context, next: Next) {
  const user = c.get('user') as any // Better-auth user with admin plugin fields
  
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
