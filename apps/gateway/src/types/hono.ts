import type { User, Session } from 'better-auth/types'

declare module 'hono' {
  interface ContextVariableMap {
    user?: User
    session?: Session
    isAuthenticated: boolean
  }
}
