import { schema } from "@usersdotfun/shared-db";
import { betterAuth, BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, anonymous, jwt } from "better-auth/plugins";
import { reactStartCookies } from "better-auth/react-start";
import { siwn } from "better-near-auth";
import { generateNonce } from "near-sign-verify";
import { db } from "~/db";

// TODO: better type safety
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  plugins: [
    anonymous({
      generateName: () => `User_${Math.random().toString(36).substring(7)}`
    }),
    siwn({
      recipient: "http://localhost:3000",
      getNonce: async () => {
        return generateNonce();
      },
    }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      adminUserIds: process.env.ADMIN_USER_IDS?.split(',') || []
    }) as unknown as BetterAuthPlugin,
    jwt({
      jwt: {
        definePayload: ({ user }) => ({
          id: user.id,
          isAnonymous: user.isAnonymous || false,
          role: user.role || 'user',
          banned: user.banned || false
        }),
        expirationTime: "1h"
      }
    }),
    reactStartCookies() // make sure this is the last plugin in the array
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutes cache
    }
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true
    }
  }
});
