import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Effect, Layer } from "effect";
import { Tag } from "effect/Context";
import { Pool } from "pg";
import { schema } from "../schema";

export class Database extends Tag("Database")<
  Database,
  NodePgDatabase<typeof schema>
>() { }

export const DatabaseLive = Layer.effect(
  Database,
  Effect.acquireRelease(
    Effect.sync(() => {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/mydb",
      });
      console.log("Database pool created.");
      return drizzle(pool, { schema });
    }),
    (db) =>
      Effect.promise(() => {
        const pool = db.$client;
        if (pool) {
          console.log("Database pool closing...");
          return pool.end();
        }
        return Promise.resolve();
      }).pipe(
        Effect.andThen(() => Effect.log("Database pool closed.")),
        Effect.catchAllDefect((defect) =>
          Effect.logError(`Error closing database pool: ${defect}`)
        )
      )
  ).pipe(
    Effect.catchAllDefect((defect) =>
      Effect.die(`Database connection failed at startup: ${defect}`)
    )
  )
);
