import { betterAuth } from "better-auth";
import { jwt, anonymous, admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { schema } from "@usersdotfun/shared-db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { 
    provider: "pg",
    schema: schema,
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-here",
  plugins: [
    anonymous(),
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
  }
});
