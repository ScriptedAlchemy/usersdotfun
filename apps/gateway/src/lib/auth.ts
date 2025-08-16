import { schema } from "@usersdotfun/shared-db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, anonymous, jwt } from "better-auth/plugins";
import { siwn } from "better-near-auth";
import { generateNonce } from "near-sign-verify";
import { db } from "../db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-here",
  plugins: [
    anonymous(),
    siwn({
      domain: process.env.DOMAIN || "localhost:3000",
      getNonce: async () => {
        return generateNonce();
      },
    }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      adminUserIds: process.env.ADMIN_USER_IDS?.split(',') || []
    }),
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
    })
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutes cache - reduces DB hits
    }
  },
  // advanced: {
  //   defaultCookieAttributes: {
  //     sameSite: "none",
  //     secure: true,
  //     partitioned: true
  //   }
  // }
});
