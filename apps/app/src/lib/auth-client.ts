import { BetterAuthClientPlugin } from "better-auth";
import { adminClient, anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { siwnClient } from "better-near-auth";
import * as near from "fastintear";

export const authClient = createAuthClient({
  baseURL: "http:localhost:3000",
  plugins: [
    anonymousClient(),
    siwnClient({
      domain: "http:localhost:3000",
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
