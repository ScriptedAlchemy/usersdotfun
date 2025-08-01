import { QUEUE_NAMES, type JobType, type QueueName } from '@usersdotfun/shared-types/types';
import { Job, Queue, Worker, type JobsOptions, type RepeatOptions } from 'bullmq';
import { Context, Effect, Layer, Runtime, Scope } from 'effect';
import type { JobData } from '../constants/queues';
import { RedisConfig } from './redis-config.service';

export interface QueueService {
  readonly add: <T extends JobData>(
    queueName: QueueName,
    jobName: string,
    data: T,
    options?: {
      delay?: number;
      attempts?: number;
      backoff?: {
        type: 'exponential' | 'fixed';
        delay: number;
      };
    }
  ) => Effect.Effect<Job<T>, Error>;

  /**
   * Upserts a job scheduler. If a scheduler with the given ID exists, it updates it.
   * Otherwise, it creates a new one.
   *
   * @param queueName The name of the queue.
   * @param schedulerId A unique ID for this job scheduler.
   * @param repeatOptions The repeat options for the scheduler (e.g., cron pattern, every N milliseconds).
   * @param jobTemplate Optional template for the jobs produced by this scheduler (name, data, options).
   * @returns An Effect that yields the first job created by this scheduler.
   */
  readonly upsertScheduledJob: <T extends JobData>(
    queueName: QueueName,
    schedulerId: string,
    repeatOptions: RepeatOptions,
    jobTemplate?: {
      name?: string;
      data?: T;
      opts?: JobsOptions;
    }
  ) => Effect.Effect<Job<T>, Error>;

  /**
   * Retrieves information about a specific job scheduler.
   *
   * @param queueName The name of the queue.
   * @param schedulerId The unique ID of the job scheduler.
   * @returns An Effect that yields the job scheduler information, or null if not found.
   */
  readonly getScheduledJobInfo: (
    queueName: QueueName,
    schedulerId: string
  ) => Effect.Effect<any | null, Error>;

  /**
 * Removes a job scheduler.
 *
 * @param queueName The name of the queue.
 * @param schedulerId The unique ID of the job scheduler to remove.
 * @returns An Effect that yields { removed: boolean } indicating if the scheduler was successfully removed.
 */
  readonly removeScheduledJob: (
    queueName: QueueName,
    schedulerId: string
  ) => Effect.Effect<{ removed: boolean }, Error>;

  readonly pauseQueue: (
    queueName: QueueName
  ) => Effect.Effect<void, Error>;

  readonly resumeQueue: (
    queueName: QueueName
  ) => Effect.Effect<void, Error>;

  readonly clearQueue: (
    queueName: QueueName,
    jobType?: JobType
  ) => Effect.Effect<{ removed: number }, Error>;

  readonly removeJob: (
    queueName: QueueName,
    workflowId: string
  ) => Effect.Effect<{ removed: boolean; reason?: string }, Error>;

  readonly retryJob: (
    queueName: QueueName,
    workflowId: string
  ) => Effect.Effect<{ retried: boolean; reason?: string }, Error>;

  readonly createWorker: <T extends JobData, E, R>(
    queueName: QueueName,
    processor: (job: Job<T>) => Effect.Effect<void, E, R>
  ) => Effect.Effect<Worker<T, any, string>, Error, R | Scope.Scope>;
}

export const QueueService = Context.GenericTag<QueueService>('QueueService');

export const QueueServiceLive = Layer.scoped(
  QueueService,
  Effect.gen(function* () {
    const redisConfig = yield* RedisConfig;

    // BullMQ Connection
    const connectionConfig = {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      username: redisConfig.username,
      db: redisConfig.db,
    };

    const queueConfigs: Record<QueueName, { defaultJobOptions: JobsOptions }> =
    {
      [QUEUE_NAMES.WORKFLOW_RUN]: {
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      },
      [QUEUE_NAMES.SOURCE_QUERY]: {
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 50,
          removeOnFail: 25,
        },
      },
      [QUEUE_NAMES.PIPELINE_EXECUTION]: {
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      },
    };


    const queueEntries = yield* Effect.all(
      Object.entries(queueConfigs).map(([name, config]) =>
        Effect.acquireRelease(
          Effect.sync(
            () =>
              new Queue(name, {
                connection: connectionConfig,
                defaultJobOptions: config.defaultJobOptions,
              })
          ),
          (q) => Effect.promise(() => q.close())
        ).pipe(Effect.map((queue) => [name, queue] as const))
      )
    );

    const queues = new Map<string, Queue>(queueEntries);

    const getQueue = (name: string): Effect.Effect<Queue, Error> => {
      const queue = queues.get(name);
      return queue
        ? Effect.succeed(queue)
        : Effect.fail(new Error(`Queue ${name} not found`));
    };

    return {
      add: <T extends JobData>(
        queueName: QueueName,
        jobName: string,
        data: T,
        options?: {
          delay?: number;
          attempts?: number;
          backoff?: { type: 'exponential' | 'fixed'; delay: number; };
        }
      ) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: () => queue.add(jobName, data, options),
            catch: (error) => new Error(`Failed to add job: ${error}`)
          })
        ),

      upsertScheduledJob: <T extends JobData>(
        queueName: QueueName,
        schedulerId: string,
        repeatOptions: RepeatOptions,
        jobTemplate?: {
          name?: string;
          data?: T;
          opts?: JobsOptions;
        }
      ) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: () =>
              queue.upsertJobScheduler(schedulerId, repeatOptions, jobTemplate),
            catch: (error) =>
              new Error(`Failed to upsert scheduled job: ${error}`),
          })
        ),

      getScheduledJobInfo: (queueName: QueueName, schedulerId: string) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: () => queue.getJobScheduler(schedulerId),
            catch: (error) =>
              new Error(
                `Failed to get scheduled job info for ${schedulerId}: ${error}`
              ),
          })
        ),

      removeScheduledJob: (queueName: QueueName, schedulerId: string) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const removed = await queue.removeJobScheduler(schedulerId);
              return { removed };
            },
            catch: (error) =>
              new Error(
                `Failed to remove scheduled job ${schedulerId}: ${error}`
              ),
          })
        ),

      pauseQueue: (queueName: QueueName) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: () => queue.pause(),
            catch: (error) =>
              new Error(`Failed to pause queue ${queueName}: ${error}`),
          })
        ),

      resumeQueue: (queueName: QueueName) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: () => queue.resume(),
            catch: (error) =>
              new Error(`Failed to resume queue ${queueName}: ${error}`),
          })
        ),

      clearQueue: (queueName: QueueName, jobType = 'all') =>
        Effect.gen(function* () {
          const queue = yield* getQueue(queueName);
          let totalRemoved = 0;

          if (jobType === 'completed' || jobType === 'all') {
            const completedRemoved = yield* Effect.tryPromise({
              try: () => queue.clean(0, 0, 'completed'),
              catch: (error) =>
                new Error(`Failed to clean completed jobs: ${error}`),
            });
            totalRemoved += completedRemoved.length;
          }

          if (jobType === 'failed' || jobType === 'all') {
            const failedRemoved = yield* Effect.tryPromise({
              try: () => queue.clean(0, 0, 'failed'),
              catch: (error) =>
                new Error(`Failed to clean failed jobs: ${error}`),
            });
            totalRemoved += failedRemoved.length;
          }

          if (jobType === 'all') {
            // Also clean delayed jobs (waiting jobs are handled differently)
            const delayedRemoved = yield* Effect.tryPromise({
              try: () => queue.clean(0, 0, 'delayed'),
              catch: (error) =>
                new Error(`Failed to clean delayed jobs: ${error}`),
            });
            totalRemoved += delayedRemoved.length;

            // For waiting jobs, we need to remove them individually since clean() doesn't support 'waiting'
            const waitingJobs = yield* Effect.tryPromise({
              try: () => queue.getWaiting(),
              catch: (error) =>
                new Error(`Failed to get waiting jobs: ${error}`),
            });

            for (const job of waitingJobs) {
              yield* Effect.tryPromise({
                try: () => job.remove(),
                catch: (error) =>
                  new Error(`Failed to remove waiting job ${job.id}: ${error}`),
              });
              totalRemoved++;
            }
          }

          return { removed: totalRemoved };
        }),

      removeJob: (queueName: QueueName, workflowId: string) =>
        Effect.gen(function* () {
          const queue = yield* getQueue(queueName);

          // Get the job first to check its state
          const job = yield* Effect.tryPromise({
            try: () => queue.getJob(workflowId),
            catch: (error) =>
              new Error(`Failed to get job ${workflowId}: ${error}`),
          });

          if (!job) {
            return { removed: false, reason: 'Job not found' };
          }

          // Check if job is active - don't allow removal of active jobs
          const activeJobs = yield* Effect.tryPromise({
            try: () => queue.getActive(),
            catch: (error) =>
              new Error(`Failed to get active jobs: ${error}`),
          });

          const isActive = activeJobs.some(
            (activeJob) => activeJob.id === workflowId
          );
          if (isActive) {
            return { removed: false, reason: 'Cannot remove active job' };
          }

          // Remove the job
          yield* Effect.tryPromise({
            try: () => job.remove(),
            catch: (error) =>
              new Error(`Failed to remove job ${workflowId}: ${error}`),
          });

          return { removed: true };
        }),

      retryJob: (queueName: QueueName, workflowId: string) =>
        Effect.gen(function* () {
          const queue = yield* getQueue(queueName);

          // Get the job first
          const job = yield* Effect.tryPromise({
            try: () => queue.getJob(workflowId),
            catch: (error) =>
              new Error(`Failed to get job ${workflowId}: ${error}`),
          });

          if (!job) {
            return { retried: false, reason: 'Job not found' };
          }

          // Check job state - only retry failed jobs or completed jobs that can be retried
          const workflowState = yield* Effect.tryPromise({
            try: () => job.getState(),
            catch: (error) => new Error(`Failed to get job state: ${error}`),
          });

          if (workflowState === 'active') {
            return { retried: false, reason: 'Cannot retry active job' };
          }

          if (workflowState === 'waiting' || workflowState === 'delayed') {
            return { retried: false, reason: 'Job is already queued' };
          }

          // Retry the job
          yield* Effect.tryPromise({
            try: () => job.retry(),
            catch: (error) =>
              new Error(`Failed to retry job ${workflowId}: ${error}`),
          });

          return { retried: true };
        }),

      createWorker: <T extends JobData, E, R>(
        queueName: QueueName,
        processor: (job: Job<T>) => Effect.Effect<void, E, R>
      ) =>
        Effect.gen(function* () {
          const runtime = yield* Effect.runtime<R>();

          const bullProcessor = async (job: Job<T>) => {
            try {
              await Runtime.runPromise(runtime)(processor(job));
            } catch (error) {
              // Let BullMQ handle retries
              throw error;
            }
          };

          const worker = yield* Effect.acquireRelease(
            Effect.sync(
              () =>
                new Worker<T>(queueName, bullProcessor, {
                  connection: connectionConfig,
                  concurrency: 5, // Process up to 5 jobs concurrently
                })
            ),
            (worker) => Effect.promise(() => worker.close())
          );

          worker.on('failed', (job, err) => {
            console.error(`Job ${job?.id} failed:`, err);
          });

          worker.on('completed', (job) => {
            console.log(`Job ${job.id} completed`);
          });

          return worker;
        }),
    };
  })
);
