import { Job, Queue, type RepeatOptions, Worker } from 'bullmq';
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
