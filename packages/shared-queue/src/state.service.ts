import { Context, Effect, Layer, Option } from 'effect';
import { Redis } from 'ioredis';
import { RedisConfig } from './redis-config.service';
import type { JobRunInfo, PipelineStep } from '@usersdotfun/shared-types/types';
import { RedisKeys } from './constants/keys';
import type { RedisKey } from './constants/keys';

export interface StateService {
  readonly get: <T>(key: RedisKey<T>) => Effect.Effect<Option.Option<T>, Error>;
  readonly set: <T>(key: RedisKey<T>, value: T) => Effect.Effect<void, Error>;
  readonly delete: (key: RedisKey<unknown>) => Effect.Effect<void, Error>;
  readonly getJobRun: (jobId: string, runId: string) => Effect.Effect<Option.Option<JobRunInfo>, Error>;
  readonly getJobRuns: (jobId: string) => Effect.Effect<string[], Error>;
  readonly getPipelineItem: (runId: string, itemIndex: number) => Effect.Effect<Option.Option<PipelineStep>, Error>;
  readonly exists: (key: RedisKey<unknown>) => Effect.Effect<boolean, Error>;
  readonly getKeys: (pattern: string) => Effect.Effect<string[], Error>;
  readonly addToRunHistory: (jobId: string, runId: string) => Effect.Effect<void, Error>;
  readonly getRunHistory: (jobId: string) => Effect.Effect<string[], Error>;
}

export const StateService = Context.GenericTag<StateService>('StateService');

export const StateServiceLive = Layer.scoped(
  StateService,
  Effect.gen(function* () {
    const prefix = 'job-state';
    const redisConfig = yield* RedisConfig;

    const redis = yield* Effect.acquireRelease(
      Effect.sync(() => new Redis(redisConfig.connectionString, { 
        keyPrefix: prefix, 
        maxRetriesPerRequest: 3 
      })),
      (redis) => Effect.promise(() => redis.quit())
    );

    return {
      get: <T>(key: RedisKey<T>) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.get(key.value);
            return result ? Option.some(JSON.parse(result)) : Option.none();
          },
          catch: (error) => new Error(`Failed to get state for ${key.value}: ${error}`),
        }),

      set: <T>(key: RedisKey<T>, value: T) =>
        Effect.asVoid(
          Effect.tryPromise({
            try: async () => {
              await redis.set(key.value, JSON.stringify(value));
            },
            catch: (error) => new Error(`Failed to set state for ${key.value}: ${error}`),
          })
        ),

      delete: (key: RedisKey<unknown>) =>
        Effect.asVoid(
          Effect.tryPromise({
            try: async () => {
              await redis.del(key.value);
            },
            catch: (error) => new Error(`Failed to delete state for ${key.value}: ${error}`),
          })
        ),

      getJobRun: (jobId, runId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.get(RedisKeys.jobRun(jobId, runId).value);
            return result ? Option.some(JSON.parse(result) as JobRunInfo) : Option.none();
          },
          catch: (error) => new Error(`Failed to get job run ${runId} for ${jobId}: ${error}`),
        }),

      getJobRuns: (jobId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.lrange(RedisKeys.jobRunHistory(jobId).value, 0, -1);
            return result || [];
          },
          catch: (error) => new Error(`Failed to get job runs for ${jobId}: ${error}`),
        }),

      getPipelineItem: (runId, itemIndex) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.get(RedisKeys.pipelineItem(runId, itemIndex).value);
            return result ? Option.some(JSON.parse(result) as PipelineStep) : Option.none();
          },
          catch: (error) => new Error(`Failed to get pipeline item ${itemIndex} for run ${runId}: ${error}`),
        }),

      exists: (key: RedisKey<unknown>) =>
        Effect.tryPromise({
          try: async () => {
            const exists = await redis.exists(key.value);
            return exists === 1;
          },
          catch: (error) => new Error(`Failed to check existence for ${key.value}: ${error}`),
        }),

      getKeys: (pattern) =>
        Effect.tryPromise({
          try: async () => {
            const keys = await redis.keys(pattern);
            return keys || [];
          },
          catch: (error) => new Error(`Failed to get keys for pattern ${pattern}: ${error}`),
        }),

      addToRunHistory: (jobId, runId) =>
        Effect.asVoid(
          Effect.tryPromise({
            try: async () => {
              const historyKey = RedisKeys.jobRunHistory(jobId);
              await redis.lpush(historyKey.value, runId);
              // Keep only the last 50 runs
              await redis.ltrim(historyKey.value, 0, 49);
            },
            catch: (error) => new Error(`Failed to add run to history for ${jobId}: ${error}`),
          })
        ),

      getRunHistory: (jobId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.lrange(RedisKeys.jobRunHistory(jobId).value, 0, -1);
            return result || [];
          },
          catch: (error) => new Error(`Failed to get run history for ${jobId}: ${error}`),
        }),
    };
  })
);
