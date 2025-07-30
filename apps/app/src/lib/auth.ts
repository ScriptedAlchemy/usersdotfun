import { betterAuth, BetterAuthPlugin } from "better-auth";
import { jwt, anonymous, admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/db";
import { schema } from "@usersdotfun/shared-db";
import { reactStartCookies } from "better-auth/react-start";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  plugins: [
    anonymous({
      generateName: () => `User_${Math.random().toString(36).substring(7)}`
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
  }
});
