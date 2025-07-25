import { Job, Queue, type RepeatOptions, Worker } from 'bullmq';
import { Context, Effect, Layer, Redacted, pipe } from 'effect';
import { AppConfig, AppConfigLive } from './config.service';

// The data payload for our different job types
export interface SourceJobData {
  jobId: string;
}

export interface PipelineJobData {
  jobDefinition: any; // Using 'any' for now, will be JobDefinition later
  item: Record<string, unknown>;
}

export type JobData = SourceJobData | PipelineJobData;

// The service interface
export interface QueueService {
  readonly add: <T extends JobData>(
    queueName: string,
    jobName: string,
    data: T
  ) => Effect.Effect<Job<T>, Error>;

  readonly addRepeatable: <T extends JobData>(
    queueName: string,
    jobName: string,
    data: T,
    options: RepeatOptions
  ) => Effect.Effect<Job<T>, Error>;

  readonly createWorker: <T extends JobData>(
    queueName: string,
    processor: (job: Job<T>) => Promise<void>
  ) => Effect.Effect<Worker<T>, Error>;
}

// The Effect Tag - needs an identifier
export const QueueService = Context.GenericTag<QueueService>('QueueService');

export const QueueServiceLive = pipe(
  Layer.scoped(
    QueueService,
    Effect.gen(function* () {
      const config = yield* AppConfig;
      const redisUrl = Redacted.value(config.redisUrl);

      const createQueue = (name: string) =>
        Effect.acquireRelease(
          Effect.sync(() => new Queue(name, {
            connection: { host: 'localhost', port: 6379 }
          })),
          (q) => Effect.promise(() => q.close())
        );

      const sourceQueue = yield* createQueue('source-jobs');
      const pipelineQueue = yield* createQueue('pipeline-jobs');

      const queues = new Map<string, Queue>([
        ['source-jobs', sourceQueue],
        ['pipeline-jobs', pipelineQueue],
      ]);

      const getQueue = (name: string): Effect.Effect<Queue, Error> => {
        const queue = queues.get(name);
        if (!queue) {
          return Effect.fail(new Error(`Queue ${name} not found`));
        }
        return Effect.succeed(queue);
      };

      return QueueService.of({
        add: <T extends JobData>(queueName: string, jobName: string, data: T) =>
          pipe(
            getQueue(queueName),
            Effect.flatMap((queue) =>
              Effect.tryPromise({
                try: () => queue.add(jobName, data),
                catch: (error) => new Error(`Failed to add job: ${error}`)
              })
            )
          ),
        addRepeatable: <T extends JobData>(
          queueName: string,
          jobName: string,
          data: T,
          options: RepeatOptions
        ) =>
          pipe(
            getQueue(queueName),
            Effect.flatMap((queue) =>
              Effect.tryPromise({
                try: () => queue.add(jobName, data, { repeat: options }),
                catch: (error) => new Error(`Failed to add repeatable job: ${error}`)
              })
            )
          ),
        createWorker: <T extends JobData>(
          queueName: string,
          processor: (job: Job<T>) => Promise<void>
        ) =>
          Effect.sync(() => new Worker(queueName, processor, {
            connection: { host: 'localhost', port: 6379 }
          }))
      });
    })
  ),
  Layer.provide(AppConfigLive)
);