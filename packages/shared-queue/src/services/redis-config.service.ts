import { Context, Effect, Layer, Redacted } from 'effect';
import { QueueConfig } from '../config';

export interface RedisConfig {
  readonly connectionString: string;
  readonly host: string;
  readonly port: number;
  readonly password?: string;
  readonly username?: string;
  readonly db: number;
}

export const RedisConfig = Context.GenericTag<RedisConfig>('RedisConfig');

const parseRedisUrl = (url: string): Effect.Effect<RedisConfig, Error> => {
  try {
    const parsed = new URL(url);
    return Effect.succeed({
      connectionString: url,
      host: parsed.hostname,
      port: parseInt(parsed.port) || 6379,
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      db: parsed.pathname ? parseInt(parsed.pathname.slice(1)) || 0 : 0,
    });
  } catch (error) {
    return Effect.fail(new Error(`Invalid Redis URL: ${url}`));
  }
};

export const RedisConfigLive = Layer.effect(
  RedisConfig,
  Effect.gen(function* () {
    const config = yield* QueueConfig;
    const redisUrl = Redacted.value(config.redisUrl);
    return yield* parseRedisUrl(redisUrl);
  })
);
