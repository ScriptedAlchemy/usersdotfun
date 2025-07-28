import { Context, Effect, Layer, Redacted } from 'effect';
import { AppConfig } from './config.service';

export interface RedisConfig {
  readonly connectionString: string;
  readonly host: string;
  readonly port: number;
  readonly password?: string;
  readonly username?: string;
  readonly db: number;
}

export const RedisConfig = Context.GenericTag<RedisConfig>('RedisConfig');

const parseRedisUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return {
      connectionString: url,
      host: parsed.hostname,
      port: parseInt(parsed.port) || 6379,
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      db: parsed.pathname ? parseInt(parsed.pathname.slice(1)) || 0 : 0,
    };
  } catch (error) {
    throw new Error(`Invalid Redis URL: ${url}`);
  }
};

export const RedisConfigLive = Layer.effect(
  RedisConfig,
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const redisUrl = Redacted.value(config.redisUrl);

    return yield* Effect.try({
      try: () => parseRedisUrl(redisUrl),
      catch: (error) => new Error(`Failed to parse Redis URL: ${error}`)
    });
  })
);
