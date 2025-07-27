import { DatabaseConfig } from '@usersdotfun/shared-db';
import { Effect, Layer, Redacted } from 'effect';
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