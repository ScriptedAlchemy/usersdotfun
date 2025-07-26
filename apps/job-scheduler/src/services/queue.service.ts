import { Job, Queue, type RepeatOptions, Worker } from 'bullmq';
import { Context, Effect, Layer, Runtime, Scope, pipe } from 'effect';
import { AppConfig } from './config.service';

export interface SourceJobData {
  jobId: string;
}

export interface PipelineJobData {
  jobDefinition: any;
  item: Record<string, unknown>;
}

export type JobData = SourceJobData | PipelineJobData;

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

  readonly createWorker: <T extends JobData, E, R>(
    queueName: string,
    processor: (job: Job<T>) => Effect.Effect<void, E, R>
  ) => Effect.Effect<Worker<T>, Error, R>;
}

export const QueueService = Context.GenericTag<QueueService>('QueueService');

export const QueueServiceLive = Layer.scoped(
  QueueService,
  Effect.gen(function* () {
    const config = yield* AppConfig;
    const scope = yield* Scope.Scope;

    // Create queues
    const sourceQueue = yield* Effect.acquireRelease(
      Effect.sync(() => new Queue('source-jobs', {
        connection: { host: 'localhost', port: 6379 }
      })),
      (q) => Effect.promise(() => q.close())
    );

    const pipelineQueue = yield* Effect.acquireRelease(
      Effect.sync(() => new Queue('pipeline-jobs', {
        connection: { host: 'localhost', port: 6379 }
      })),
      (q) => Effect.promise(() => q.close())
    );

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

      createWorker: <T extends JobData, E, R>(
        queueName: string,
        processor: (job: Job<T>) => Effect.Effect<void, E, R>
      ) =>
        Effect.gen(function* () {
          // Capture the current context as a Runtime
          const runtime = yield* Effect.runtime<R>();

          const bullProcessor = (job: Job<T>) => {
            // Use the captured runtime to run the Effect
            // Catch any errors from processor(job) and convert them to a Promise rejection
            return Runtime.runPromise(runtime)(processor(job));
          };

          // Synchronously create the worker instance
          const worker = yield* Effect.sync(() => new Worker<T>(queueName, bullProcessor, {
            connection: { host: 'localhost', port: 6379 }
          }));

          // Register cleanup with the current scope.
          yield* Effect.addFinalizer(() =>
            Effect.promise(() => worker.close()).pipe(
              Effect.catchAll((error) => Effect.logError(`Error closing worker ${queueName}:`, error)),
              Effect.map(() => void 0) // Ensure the finalizer returns void
            )
          );

          return worker;
        }).pipe(
          // Ensure the error type is 'Error' as per the interface
          Effect.mapError(error => new Error(`Failed to create worker due to unexpected error: ${error}`))
        )
    });
  })
);