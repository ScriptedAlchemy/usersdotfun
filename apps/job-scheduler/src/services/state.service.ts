import { Context, Effect, Layer, Option } from 'effect';
import { Redis } from 'ioredis';
import { RedisConfig } from './redis-config.service';

export interface StateService {
  readonly get: (jobId: string) => Effect.Effect<Option.Option<unknown>, Error>;
  readonly set: (jobId: string, state: unknown, ttlSeconds?: number) => Effect.Effect<void, Error>;
  readonly delete: (jobId: string) => Effect.Effect<void, Error>;
  readonly exists: (jobId: string) => Effect.Effect<boolean, Error>;
}

export const StateService = Context.GenericTag<StateService>('StateService');

export const StateServiceLive = Layer.scoped(
  StateService,
  Effect.gen(function* () {
    const prefix = 'job-state';

    const redisConfig = yield* RedisConfig;

    // Redis connection for state management
    const redis = yield* Effect.acquireRelease(
      Effect.sync(() => new Redis(redisConfig.connectionString, { keyPrefix: prefix, maxRetriesPerRequest: 3 })),
      (redis) => Effect.promise(() => redis.quit())
    );

    return {
      get: (jobId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.get(jobId);
            return result ? Option.some(JSON.parse(result)) : Option.none();
          },
          catch: (error) => new Error(`Failed to get state for ${jobId}: ${error}`),
        }),

      set: (jobId, state, ttlSeconds) =>
        Effect.asVoid(
          Effect.tryPromise({
            try: async () => {
              const serialized = JSON.stringify(state);
              if (ttlSeconds) {
                await redis.setex(jobId, ttlSeconds, serialized);
              } else {
                await redis.set(jobId, serialized);
              }
            },
            catch: (error) => new Error(`Failed to set state for ${jobId}: ${error}`),
          })
        ),

      delete: (jobId) =>
        Effect.asVoid(
          Effect.tryPromise({
            try: () => redis.del(jobId),
            catch: (error) => new Error(`Failed to delete state for ${jobId}: ${error}`),
          })
        ),

      exists: (jobId) =>
        Effect.tryPromise({
          try: async () => {
            const exists = await redis.exists(jobId);
            return exists === 1;
          },
          catch: (error) => new Error(`Failed to check existence for ${jobId}: ${error}`),
        }),
    };
  })
);