import { Context, Effect, Layer } from 'effect';
import { Queue } from 'bullmq';
import { RedisConfig } from './redis-config.service';

export interface QueueStatus {
  readonly name: string;
  readonly waiting: number;
  readonly active: number;
  readonly completed: number;
  readonly failed: number;
  readonly delayed: number;
  readonly paused: boolean;
}

export interface JobStatus {
  readonly id: string;
  readonly name: string;
  readonly data: any;
  readonly progress: number;
  readonly attemptsMade: number;
  readonly timestamp: number;
  readonly processedOn?: number;
  readonly finishedOn?: number;
  readonly failedReason?: string;
  readonly returnvalue?: any;
}

export interface QueueStatusService {
  readonly getQueueStatus: (queueName: string) => Effect.Effect<QueueStatus, Error>;
  readonly getActiveJobs: (queueName: string) => Effect.Effect<JobStatus[], Error>;
  readonly getWaitingJobs: (queueName: string) => Effect.Effect<JobStatus[], Error>;
  readonly getCompletedJobs: (queueName: string, start?: number, end?: number) => Effect.Effect<JobStatus[], Error>;
  readonly getFailedJobs: (queueName: string, start?: number, end?: number) => Effect.Effect<JobStatus[], Error>;
  readonly getDelayedJobs: (queueName: string, start?: number, end?: number) => Effect.Effect<JobStatus[], Error>;
  readonly getJobById: (queueName: string, jobId: string) => Effect.Effect<JobStatus | null, Error>;
}

export const QueueStatusService = Context.GenericTag<QueueStatusService>('QueueStatusService');

const mapBullJobToJobStatus = (job: any): JobStatus => ({
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
