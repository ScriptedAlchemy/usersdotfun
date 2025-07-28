import { Context, Effect, Layer, Option } from 'effect';
import { Redis } from 'ioredis';
import { RedisConfig } from './redis-config.service';

export interface StateService {
  readonly get: (jobId: string) => Effect.Effect<Option.Option<unknown>, Error>;
  readonly getJobRun: (jobId: string, runId: string) => Effect.Effect<Option.Option<unknown>, Error>;
  readonly getJobRuns: (jobId: string) => Effect.Effect<string[], Error>;
  readonly getPipelineItem: (runId: string, itemIndex: number) => Effect.Effect<Option.Option<unknown>, Error>;
  readonly exists: (jobId: string) => Effect.Effect<boolean, Error>;
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
      get: (jobId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.get(jobId);
            return result ? Option.some(JSON.parse(result)) : Option.none();
          },
          catch: (error) => new Error(`Failed to get state for ${jobId}: ${error}`),
        }),

      getJobRun: (jobId, runId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.get(`job-run:${jobId}:${runId}`);
            return result ? Option.some(JSON.parse(result)) : Option.none();
          },
          catch: (error) => new Error(`Failed to get job run ${runId} for ${jobId}: ${error}`),
        }),

      getJobRuns: (jobId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.lrange(`job-runs:${jobId}:history`, 0, -1);
            return result || [];
          },
          catch: (error) => new Error(`Failed to get job runs for ${jobId}: ${error}`),
        }),

      getPipelineItem: (runId, itemIndex) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.get(`pipeline-item:${runId}:${itemIndex}`);
            return result ? Option.some(JSON.parse(result)) : Option.none();
          },
          catch: (error) => new Error(`Failed to get pipeline item ${itemIndex} for run ${runId}: ${error}`),
        }),

      exists: (jobId) =>
        Effect.tryPromise({
          try: async () => {
            const exists = await redis.exists(jobId);
            return exists === 1;
          },
          catch: (error) => new Error(`Failed to check existence for ${jobId}: ${error}`),
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
              const historyKey = `job-runs:${jobId}:history`;
              await redis.lpush(historyKey, runId);
              // Keep only the last 50 runs
              await redis.ltrim(historyKey, 0, 49);
            },
            catch: (error) => new Error(`Failed to add run to history for ${jobId}: ${error}`),
          })
        ),

      getRunHistory: (jobId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.lrange(`job-runs:${jobId}:history`, 0, -1);
            return result || [];
          },
          catch: (error) => new Error(`Failed to get run history for ${jobId}: ${error}`),
        }),
    };
  })
);
