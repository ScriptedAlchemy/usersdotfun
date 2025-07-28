import { auth } from '../lib/auth'
import type { Context, Next } from 'hono'

export async function authMiddleware(c: Context, next: Next) {
  try {
    // Check if the proxy has already validated the session and passed user headers
    const userId = c.req.header('x-user-id')
    const userRole = c.req.header('x-user-role') || 'user'
    const isAnonymous = c.req.header('x-is-anonymous') === 'true'
    
    if (userId) {
      // Trust the proxy's session validation
      const user = {
        id: userId,
        email: '', // Anonymous users don't have email
        emailVerified: false,
        name: `Anonymous User`,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: userRole,
        isAnonymous,
        banned: false // The proxy would have already checked this
      } as any
      
      c.set('user', user)
      c.set('userId', userId)
      c.set('userRole', userRole)
      c.set('isAnonymous', isAnonymous)
      c.set('isAuthenticated', true)
      console.log('Gateway auth: Using proxy session', { userId, isAnonymous, role: userRole })
    } else {
      // No user context from proxy - this is fine for public endpoints
      c.set('isAuthenticated', false)
      console.log('Gateway auth: No user context from proxy')
    }
  } catch (error) {
    console.error('Session validation error:', error)
    c.set('isAuthenticated', false)
  }
  
  await next()
}

export async function requireAuth(c: Context, next: Next) {
  if (!c.get('isAuthenticated')) {
    return c.json({ error: 'Authentication required. Please sign in or continue as guest.' }, 401)
  }
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
