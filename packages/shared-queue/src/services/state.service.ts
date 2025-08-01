import type { PluginRun, WorkflowRunInfo } from '@usersdotfun/shared-types/types';
import { Context, Effect, Layer, Option } from 'effect';
import { Redis } from 'ioredis';
import type { RedisKey } from '../constants/keys';
import { RedisKeys } from '../constants/keys';
import { RedisConfig } from './redis-config.service';

export interface StateService {
  // --- Generic Methods ---
  readonly get: <T>(key: RedisKey<T>) => Effect.Effect<Option.Option<T>, Error>;
  readonly set: <T>(key: RedisKey<T>, value: T) => Effect.Effect<void, Error>;
  readonly delete: (key: RedisKey<unknown>) => Effect.Effect<void, Error>;
  readonly getKeys: (pattern: string) => Effect.Effect<string[], Error>;

  // --- Specific, High-Level Methods ---
  readonly getRunSummary: (workflowId: string, runId: string) => Effect.Effect<Option.Option<WorkflowRunInfo>, Error>;
  readonly setRunSummary: (workflowId: string, runId: string, info: WorkflowRunInfo) => Effect.Effect<void, Error>;

  readonly getPluginRunState: (runId: string, itemId: string, stepId: string) => Effect.Effect<Option.Option<PluginRun>, Error>;
  readonly setPluginRunState: (runId: string, itemId: string, stepId: string, state: PluginRun) => Effect.Effect<void, Error>;

  readonly addToRunHistory: (workflowId: string, runId: string) => Effect.Effect<void, Error>;
  readonly getRunHistory: (workflowId: string) => Effect.Effect<string[], Error>;
}

export const StateService = Context.GenericTag<StateService>('StateService');

export const StateServiceLive = Layer.scoped(
  StateService,
  Effect.gen(function* () {
    const prefix = 'workflow-state'; // Updated prefix for clarity
    const redisConfig = yield* RedisConfig;

    const redis = yield* Effect.acquireRelease(
      Effect.sync(() => new Redis(redisConfig.connectionString, {
        keyPrefix: prefix,
        maxRetriesPerRequest: 3
      })),
      (redis) => Effect.promise(() => redis.quit())
    );

    // --- Generic Implementation ---
    const get = <T>(key: RedisKey<T>) =>
      Effect.tryPromise({
        try: async () => {
          const result = await redis.get(key.value);
          return result ? Option.some(JSON.parse(result) as T) : Option.none();
        },
        catch: (error) => new Error(`Failed to GET state for ${key.value}: ${error}`),
      });

    const set = <T>(key: RedisKey<T>, value: T) =>
      Effect.asVoid(
        Effect.tryPromise({
          try: () => redis.set(key.value, JSON.stringify(value)),
          catch: (error) => new Error(`Failed to SET state for ${key.value}: ${error}`),
        })
      );

    const del = (key: RedisKey<unknown>) =>
      Effect.asVoid(
        Effect.tryPromise({
          try: () => redis.del(key.value),
          catch: (error) => new Error(`Failed to DELETE state for ${key.value}: ${error}`),
        })
      );

    const getKeys = (pattern: string) =>
      Effect.tryPromise({
        try: () => redis.keys(`${prefix}:${pattern}`), // Ensure prefix is included in pattern search
        catch: (error) => new Error(`Failed to get KEYS for pattern ${pattern}: ${error}`),
      });

    return {
      // --- Generic Methods ---
      get,
      set,
      delete: del,
      getKeys,

      // --- Specific, High-Level Methods ---
      getRunSummary: (workflowId, runId) => get(RedisKeys.runSummary(workflowId, runId)),
      setRunSummary: (workflowId, runId, info) => set(RedisKeys.runSummary(workflowId, runId), info),

      getPluginRunState: (runId, itemId, stepId) => get(RedisKeys.pluginRunState(runId, itemId, stepId)),
      setPluginRunState: (runId, itemId, stepId, state) => set(RedisKeys.pluginRunState(runId, itemId, stepId), state),

      addToRunHistory: (workflowId, runId) =>
        Effect.asVoid(
          Effect.tryPromise({
            try: async () => {
              const historyKey = RedisKeys.workflowRunHistory(workflowId);
              await redis.lpush(historyKey.value, runId);
              await redis.ltrim(historyKey.value, 0, 49); // Keep only the last 50 runs
            },
            catch: (error) => new Error(`Failed to add run to history for ${workflowId}: ${error}`),
          })
        ),

      getRunHistory: (workflowId) =>
        Effect.tryPromise({
          try: async () => {
            const result = await redis.lrange(RedisKeys.workflowRunHistory(workflowId).value, 0, -1);
            return result || [];
          },
          catch: (error) => new Error(`Failed to get run history for ${workflowId}: ${error}`),
        }),
    };
  })
);