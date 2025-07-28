import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous } from "better-auth/plugins";
import { db } from "~/db";
import { reactStartCookies } from "better-auth/react-start";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [
    anonymous(),
    jwt(), 
    reactStartCookies() // make sure this is the last plugin in the array
  ]
});