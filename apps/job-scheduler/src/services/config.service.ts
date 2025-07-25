import { Config, Context, Layer, Redacted } from 'effect';

export interface AppConfig {
  readonly redisUrl: Redacted.Redacted;
}

export const AppConfig = Context.GenericTag<AppConfig>('AppConfig');

const appConfigSchema = Config.all({
  redisUrl: Config.redacted('REDIS_URL'),
});

export const AppConfigLive = Layer.effect(AppConfig, appConfigSchema);