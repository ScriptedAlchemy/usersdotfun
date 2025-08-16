import { BetterAuthClientPlugin } from "better-auth"
import { adminClient, anonymousClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { siwnClient } from "better-near-auth"

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  plugins: [
    anonymousClient(),
    siwnClient({
      domain: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      // @ts-expect-error - TODO: fix window.near declare
      signer: typeof window !== 'undefined' ? window.near : undefined
    }),
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
