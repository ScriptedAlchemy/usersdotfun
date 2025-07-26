import { Context, Effect, Layer, Option, Redacted, pipe } from 'effect';
import { Redis } from 'ioredis';
import { AppConfig, AppConfigLive } from './config.service';

export interface StateService {
  readonly get: (
    jobId: string
  ) => Effect.Effect<Option.Option<unknown>, Error>;

  readonly set: (
    jobId: string,
    state: unknown
  ) => Effect.Effect<void, Error>;

  readonly delete: (jobId: string) => Effect.Effect<void, Error>;
}

export const StateService = Context.GenericTag<StateService>('StateService');

export const RedisTag = Context.GenericTag<Redis>('Redis');

export const RedisLive = Layer.scoped(
  RedisTag,
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const redisUrl = Redacted.value(config.redisUrl);
    const redis = new Redis(redisUrl);
    yield* Effect.addFinalizer(() => Effect.sync(() => redis.quit()));
    return redis;
  })
);

export const StateServiceLayer =
  Layer.effect(
    StateService,
    Effect.gen(function* () {
      const redis = yield* RedisTag;
      const prefix = 'job-state';

      const getKey = (jobId: string) => `${prefix}:${jobId}`;

      return StateService.of({
        get: (jobId) =>
          Effect.tryPromise({
            try: async () => {
              const result = await redis.get(getKey(jobId));
              return result ? Option.some(JSON.parse(result)) : Option.none();
            },
            catch: (error) => new Error(`Failed to get state for ${jobId}: ${error}`),
          }),
        set: (jobId, state) =>
          pipe(
            Effect.tryPromise({
              try: () => redis.set(getKey(jobId), JSON.stringify(state)),
              catch: (error) => new Error(`Failed to set state for ${jobId}: ${error}`),
            }),
            Effect.map(() => { })
          ),
        delete: (jobId) =>
          pipe(
            Effect.tryPromise({
              try: () => redis.del(getKey(jobId)),
              catch: (error) => new Error(`Failed to delete state for ${jobId}: ${error}`),
            }),
            Effect.map(() => { })
          ),
      });
    })
  );

  export const StateServiceLive = StateServiceLayer;