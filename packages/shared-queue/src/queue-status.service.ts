import { Context, Effect, Layer } from 'effect';
import { Queue } from 'bullmq';
import { RedisConfig } from './redis-config.service';
import type { QueueName } from './constants/queues';
import type { QueueStatus, QueueJobStatus } from '@usersdotfun/shared-types/types';

export interface QueueStatusService {
  readonly getQueueStatus: (queueName: QueueName) => Effect.Effect<QueueStatus, Error>;
  readonly getActiveJobs: (queueName: QueueName) => Effect.Effect<QueueJobStatus[], Error>;
  readonly getWaitingJobs: (queueName: QueueName) => Effect.Effect<QueueJobStatus[], Error>;
  readonly getCompletedJobs: (queueName: QueueName, start?: number, end?: number) => Effect.Effect<QueueJobStatus[], Error>;
  readonly getFailedJobs: (queueName: QueueName, start?: number, end?: number) => Effect.Effect<QueueJobStatus[], Error>;
  readonly getDelayedJobs: (queueName: QueueName, start?: number, end?: number) => Effect.Effect<QueueJobStatus[], Error>;
  readonly getJobById: (queueName: QueueName, jobId: string) => Effect.Effect<QueueJobStatus | null, Error>;
}

export const QueueStatusService = Context.GenericTag<QueueStatusService>('QueueStatusService');

const mapBullJobToJobStatus = (job: any): QueueJobStatus => ({
  id: job.id,
  name: job.name,
  data: job.data,
  progress: job.progress || 0,
  attemptsMade: job.attemptsMade || 0,
  timestamp: job.timestamp,
  processedOn: job.processedOn,
  finishedOn: job.finishedOn,
  failedReason: job.failedReason,
  returnvalue: job.returnvalue,
});

export const QueueStatusServiceLive = Layer.scoped(
  QueueStatusService,
  Effect.gen(function* () {
    const redisConfig = yield* RedisConfig;

    const connectionConfig = {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      username: redisConfig.username,
      db: redisConfig.db,
    };

    const sourceQueue = yield* Effect.acquireRelease(
      Effect.sync(() => new Queue('source-jobs', { connection: connectionConfig })),
      (q) => Effect.promise(() => q.close())
    );

    const pipelineQueue = yield* Effect.acquireRelease(
      Effect.sync(() => new Queue('pipeline-jobs', { connection: connectionConfig })),
      (q) => Effect.promise(() => q.close())
    );

    const queues = new Map<string, Queue>([
      ['source-jobs', sourceQueue],
      ['pipeline-jobs', pipelineQueue],
    ]);

    const getQueue = (name: string): Effect.Effect<Queue, Error> => {
      const queue = queues.get(name);
      return queue
        ? Effect.succeed(queue)
        : Effect.fail(new Error(`Queue ${name} not found`));
    };

    return {
      getQueueStatus: (queueName) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
                queue.getWaiting(),
                queue.getActive(),
                queue.getCompleted(),
                queue.getFailed(),
                queue.getDelayed(),
                queue.isPaused(),
              ]);

              return {
                name: queueName,
                waiting: waiting.length,
                active: active.length,
                completed: completed.length,
                failed: failed.length,
                delayed: delayed.length,
                paused,
              };
            },
            catch: (error) => new Error(`Failed to get queue status for ${queueName}: ${error}`),
          })
        ),

      getActiveJobs: (queueName) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const jobs = await queue.getActive();
              return jobs.map(mapBullJobToJobStatus);
            },
            catch: (error) => new Error(`Failed to get active jobs for ${queueName}: ${error}`),
          })
        ),

      getWaitingJobs: (queueName) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const jobs = await queue.getWaiting();
              return jobs.map(mapBullJobToJobStatus);
            },
            catch: (error) => new Error(`Failed to get waiting jobs for ${queueName}: ${error}`),
          })
        ),

      getCompletedJobs: (queueName, start = 0, end = 99) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const jobs = await queue.getCompleted(start, end);
              return jobs.map(mapBullJobToJobStatus);
            },
            catch: (error) => new Error(`Failed to get completed jobs for ${queueName}: ${error}`),
          })
        ),

      getFailedJobs: (queueName, start = 0, end = 99) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const jobs = await queue.getFailed(start, end);
              return jobs.map(mapBullJobToJobStatus);
            },
            catch: (error) => new Error(`Failed to get failed jobs for ${queueName}: ${error}`),
          })
        ),

      getDelayedJobs: (queueName, start = 0, end = 99) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const jobs = await queue.getDelayed(start, end);
              return jobs.map(mapBullJobToJobStatus);
            },
            catch: (error) => new Error(`Failed to get delayed jobs for ${queueName}: ${error}`),
          })
        ),

      getJobById: (queueName, jobId) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const job = await queue.getJob(jobId);
              return job ? mapBullJobToJobStatus(job) : null;
            },
            catch: (error) => new Error(`Failed to get job ${jobId} from ${queueName}: ${error}`),
          })
        ),
    };
  })
);
