import type { JobRunInfo, PipelineStep, JobError } from '@usersdotfun/shared-types/types';
import type { QueueStatus } from 'src/queue-status.service';

/**
 * A type-safe representation of a Redis key.
 * The `_value` property is a "phantom type" used solely for type inference
 * and does not exist at runtime.
 */
export type RedisKey<T> = {
  readonly __type: 'RedisKey';
  readonly value: string;
  readonly _value: T;
};

// ============================================================================
// Redis Key Factories for specific data types
// These functions enforce consistent key naming and associate them with data types.
// ============================================================================

export const RedisKeys = {
  /**
   * Generates a RedisKey for a job's state.
   * Example: `job:JOB_ID:state`
   * @param jobId The ID of the job.
   */
  jobState: <T>(jobId: string): RedisKey<T> => ({
    __type: 'RedisKey',
    value: `job:${jobId}:state`,
    _value: undefined as T,
  }),

  /**
   * Generates a RedisKey for a specific job run's information.
   * Example: `job:JOB_ID:run:RUN_ID`
   * @param jobId The ID of the source job.
   * @param runId The ID of the specific run.
   */
  jobRun: (jobId: string, runId: string): RedisKey<JobRunInfo> => ({
    __type: 'RedisKey',
    value: `job:${jobId}:run:${runId}`,
    _value: undefined as unknown as JobRunInfo,
  }),

  /**
   * Generates a RedisKey for the history of runs for a given job.
   * Example: `job:JOB_ID:runs:history`
   * Stores string[] (list of runIds)
   * @param jobId The ID of the job.
   */
  jobRunHistory: (jobId: string): RedisKey<string[]> => ({
    __type: 'RedisKey',
    value: `job:${jobId}:runs:history`,
    _value: undefined as unknown as string[],
  }),

  /**
   * Generates a RedisKey for a specific pipeline item within a run.
   * Example: `pipeline:RUN_ID:item:ITEM_INDEX`
   * @param runId The ID of the job run.
   * @param itemIndex The index of the item within the pipeline.
   */
  pipelineItem: (runId: string, itemIndex: number): RedisKey<PipelineStep> => ({
    __type: 'RedisKey',
    value: `pipeline:${runId}:item:${itemIndex}`,
    _value: undefined as unknown as PipelineStep,
  }),

  /**
   * Generates a RedisKey for job errors.
   * Example: `job-error:JOB_ID`
   * @param jobId The ID of the job.
   */
  jobError: (jobId: string): RedisKey<JobError> => ({
    __type: 'RedisKey',
    value: `job-error:${jobId}`,
    _value: undefined as unknown as JobError,
  }),

  /**
   * Generates a RedisKey for queue status.
   * Example: `queue:QUEUE_NAME:status`
   * @param queueName The name of the queue.
   */
  queueStatus: (queueName: string): RedisKey<QueueStatus> => ({
    __type: 'RedisKey',
    value: `queue:${queueName}:status`,
    _value: undefined as unknown as QueueStatus,
  }),
} as const;

// Helper for generic keys (e.g., for arbitrary data)
export const createRedisKey = <T>(key: string): RedisKey<T> => ({
  __type: 'RedisKey',
  value: key,
  _value: undefined as T,
});
