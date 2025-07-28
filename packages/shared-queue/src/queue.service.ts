import { Job, Queue, type RepeatOptions, Worker, type RepeatableJob } from 'bullmq';
import { Context, Effect, Layer, Runtime, Scope } from 'effect';
import { RedisConfig } from './redis-config.service';

export interface SourceJobData {
  jobId: string;
}

export interface PipelineJobData {
  jobDefinition: any;
  item: Record<string, unknown>;
  runId: string;
  itemIndex: number;
  sourceJobId: string;
}

export type JobData = SourceJobData | PipelineJobData;

export interface QueueService {
  readonly add: <T extends JobData>(
    queueName: string,
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

  readonly addRepeatable: <T extends JobData>(
    queueName: string,
    jobName: string,
    data: T,
    options: RepeatOptions
  ) => Effect.Effect<Job<T>, Error>;

  readonly getRepeatableJobs: (
    queueName: string
  ) => Effect.Effect<Array<RepeatableJob>, Error>;


  readonly addRepeatableIfNotExists: <T extends JobData>(
    queueName: string,
    jobName: string,
    data: T,
    options: RepeatOptions
  ) => Effect.Effect<{ added: boolean; job?: Job<T> }, Error>;

  readonly removeRepeatableJob: (
    queueName: string,
    jobId: string,
    jobName?: string
  ) => Effect.Effect<{ removed: boolean; count: number }, Error>;

  readonly createWorker: <T extends JobData, E, R>(
    queueName: string,
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

    // Create queues with proper resource management
    const sourceQueue = yield* Effect.acquireRelease(
      Effect.sync(() => new Queue('source-jobs', {
        connection: connectionConfig,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        }
      })),
      (q) => Effect.promise(() => q.close())
    );

    const pipelineQueue = yield* Effect.acquireRelease(
      Effect.sync(() => new Queue('pipeline-jobs', {
        connection: connectionConfig,
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        }
      })),
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
      add: <T extends JobData>(
        queueName: string,
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

      addRepeatable: <T extends JobData>(
        queueName: string,
        jobName: string,
        data: T,
        options: RepeatOptions
      ) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: () => queue.add(jobName, data, {
              repeat: options,
            }),
            catch: (error) => new Error(`Failed to add repeatable job: ${error}`)
          })
        ),

      getRepeatableJobs: (queueName: string) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: () => queue.getRepeatableJobs(),
            catch: (error) => new Error(`Failed to get repeatable jobs: ${error}`)
          })
        ),


      addRepeatableIfNotExists: <T extends JobData>(
        queueName: string,
        jobName: string,
        data: T,
        options: RepeatOptions
      ) =>
        Effect.gen(function* () {
          const queue = yield* getQueue(queueName);
          const existingJobs = yield* Effect.tryPromise({
            try: () => queue.getRepeatableJobs(),
            catch: (error) => new Error(`Failed to get repeatable jobs: ${error}`)
          });

          // Check if a job with the same name and pattern already exists
          // RepeatableJob has properties: key, name, id, endDate, tz, pattern, every
          const jobId = (data as SourceJobData).jobId;
          const existingJob = existingJobs.find(job => 
            job.name === jobName && 
            job.pattern === options.pattern &&
            job.key.includes(jobId) // The key often contains job data info
          );

          if (existingJob) {
            // Job already exists with same schedule - no need to add
            return { added: false };
          }

          // Check if job exists with different schedule - remove old one first
          const jobWithDifferentSchedule = existingJobs.find(job =>
            job.name === jobName &&
            job.key.includes(jobId) &&
            job.pattern !== options.pattern
          );

          if (jobWithDifferentSchedule) {
            // Remove the old job with different schedule using the newer method
            yield* Effect.tryPromise({
              try: () => queue.removeJobScheduler(jobWithDifferentSchedule.key),
              catch: (error) => new Error(`Failed to remove old repeatable job: ${error}`)
            });
          }

          // Add the new job
          const job = yield* Effect.tryPromise({
            try: () => queue.add(jobName, data, { repeat: options }),
            catch: (error) => new Error(`Failed to add repeatable job: ${error}`)
          });

          return { added: true, job };
        }),

      removeRepeatableJob: (queueName: string, jobId: string, jobName = 'scheduled-source-run') =>
        Effect.gen(function* () {
          const queue = yield* getQueue(queueName);
          const existingJobs = yield* Effect.tryPromise({
            try: () => queue.getRepeatableJobs(),
            catch: (error) => new Error(`Failed to get repeatable jobs: ${error}`)
          });

          // Find all jobs that match the jobId
          const jobsToRemove = existingJobs.filter(job => 
            job.name === jobName && job.key.includes(jobId)
          );

          if (jobsToRemove.length === 0) {
            return { removed: false, count: 0 };
          }

          // Remove all matching jobs
          let removedCount = 0;
          for (const job of jobsToRemove) {
            yield* Effect.tryPromise({
              try: async () => {
                await queue.removeJobScheduler(job.key);
                removedCount++;
              },
              catch: (error) => new Error(`Failed to remove repeatable job ${job.key}: ${error}`)
            });
          }

          return { removed: removedCount > 0, count: removedCount };
        }),

      createWorker: <T extends JobData, E, R>(
        queueName: string,
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
            Effect.sync(() => new Worker<T>(queueName, bullProcessor, {
              connection: connectionConfig,
              concurrency: 5, // Process up to 5 jobs concurrently
            })),
            (worker) => Effect.promise(() => worker.close())
          );

          worker.on('failed', (job, err) => {
            console.error(`Job ${job?.id} failed:`, err);
          });

          worker.on('completed', (job) => {
            console.log(`Job ${job.id} completed`);
          });

          return worker;
        })
    };
  })
);
