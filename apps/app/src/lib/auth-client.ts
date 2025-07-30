import { createAuthClient } from "better-auth/react"
import { anonymousClient, adminClient } from "better-auth/client/plugins"
import { BetterAuthClientPlugin } from "better-auth"

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  plugins: [
    anonymousClient(),
    adminClient() as unknown as BetterAuthClientPlugin
  ]
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient
