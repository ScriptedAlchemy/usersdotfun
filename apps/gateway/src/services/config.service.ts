import { Config, Context, Layer, Redacted } from 'effect';

export interface AppConfigData {
  readonly databaseUrl: Redacted.Redacted<string>;
  readonly redisUrl: Redacted.Redacted<string>;
}

export const AppConfig = Context.GenericTag<AppConfigData>("AppConfig");

const appConfigSchema = Config.all({
  databaseUrl: Config.redacted("DATABASE_URL"),
  redisUrl: Config.redacted("REDIS_URL")
});

export const AppConfigLive = Layer.effect(AppConfig, appConfigSchema);
