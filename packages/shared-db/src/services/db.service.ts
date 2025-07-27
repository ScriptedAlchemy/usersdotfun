import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Context, Effect, Layer } from "effect";
import { Pool } from "pg";
import { schema } from "../schema";

export interface DatabaseData {
  readonly db: NodePgDatabase<typeof schema>;
}

export const Database = Context.GenericTag<DatabaseData>("Database");

export interface DatabaseConfigData {
  readonly connectionString: string;
}

export const DatabaseConfig = Context.GenericTag<DatabaseConfigData>("DatabaseConfig");

export const DatabaseLive = Layer.scoped(
  Database,
  Effect.gen(function* () {
    const config = yield* DatabaseConfig;

    const pool = yield* Effect.acquireRelease(
      Effect.sync(() => {
        console.log("Database pool created.");
        return new Pool({ connectionString: config.connectionString });
      }),
      (pool) =>
        Effect.promise(() => {
          console.log("Database pool closing...");
          return pool.end();
        }).pipe(
          Effect.catchAllDefect((error) =>
            Effect.logError(`Error closing database pool: ${error}`)
          )
        )
    );

    const db = drizzle(pool, { schema });
    return { db };
  })
);