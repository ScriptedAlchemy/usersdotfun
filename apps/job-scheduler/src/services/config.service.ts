import { Config, Context, Layer, Redacted } from 'effect';

export interface AppConfigData {
  readonly redisUrl: Redacted.Redacted<string>;
  readonly databaseUrl: Redacted.Redacted<string>;
}

export class AppConfig extends Context.Tag("AppConfig")<
  AppConfig,
  AppConfigData
>() { }

const appConfigSchema = Config.all({
  redisUrl: Config.redacted("REDIS_URL"),
  databaseUrl: Config.redacted("DATABASE_URL")
});

export const AppConfigLive = Layer.effect(
  AppConfig,
  appConfigSchema
);