import { Layer, Effect, Redacted } from 'effect';
import { DatabaseConfig } from '@usersdotfun/shared-db';
import { AppConfig } from './config.service';

export const DatabaseConfigLive = Layer.effect(
  DatabaseConfig,
  Effect.gen(function* () {
    const appConfig = yield* AppConfig;
    return {
      connectionString: Redacted.value(appConfig.databaseUrl)
    };
  })
);