import { BunTerminal } from "@effect/platform-bun";
import { PluginLoaderLive } from '@usersdotfun/pipeline-runner';
import { Database, DatabaseLive, JobService, JobServiceLive } from '@usersdotfun/shared-db';
import { Effect, Layer, Logger, LogLevel } from 'effect';
import { runPromise } from "effect-errors";
import { jobs } from './jobs';
import { AppConfigLive } from './services/config.service';
import { DatabaseConfigLive } from './services/database-config.service';
import { QueueService, QueueServiceLive } from './services/queue.service';
import { RedisConfigLive } from './services/redis-config.service';
import { StateService, StateServiceLive } from './services/state.service';
import { createPipelineWorker } from './workers/pipeline.worker';
import { createSourceWorker } from './workers/source.worker';

// Build layers with proper dependencies
const ConfigLayer = AppConfigLive;

const InfrastructureLayer = Layer.mergeAll(
  RedisConfigLive,
  DatabaseConfigLive
).pipe(Layer.provide(ConfigLayer));

const DatabaseLayer = DatabaseLive.pipe(
  Layer.provide(InfrastructureLayer)
);

const ServicesLayer = Layer.mergeAll(
  JobServiceLive,
  QueueServiceLive,
  StateServiceLive,
  PluginLoaderLive
).pipe(
  Layer.provide(Layer.mergeAll(ConfigLayer, InfrastructureLayer, DatabaseLayer))
);

const LoggingLayer = Layer.mergeAll(
  BunTerminal.layer,
  Logger.pretty,
  Logger.minimumLogLevel(LogLevel.Info)
);

const AppLayer = Layer.mergeAll(
  ConfigLayer,
  InfrastructureLayer,
  DatabaseLayer,
  ServicesLayer,
  LoggingLayer
);

const program = Effect.gen(function* () {
  const queueService = yield* QueueService;
  const { db } = yield* Database;
  const jobService = yield* JobService;
  const stateService = yield* StateService;

  yield* Effect.log('Scheduling jobs...');
  yield* Effect.forEach(
    jobs,
    (job) =>
      Effect.gen(function* () {
        yield* jobService.createJob({
          id: job.id,
          name: job.name,
          schedule: job.schedule,
          status: 'scheduled',
          sourcePlugin: job.source.plugin,
          sourceConfig: job.source.config,
          sourceSearch: job.source.search,
          pipeline: job.pipeline,
        });

        yield* queueService.addRepeatable(
          'source-jobs',
          'scheduled-source-run',
          { jobId: job.id },
          { pattern: job.schedule }
        );
      }),
    { concurrency: 5, discard: true }
  );

  yield* Effect.log('Starting workers...');
  yield* Effect.fork(createSourceWorker);
  yield* Effect.fork(createPipelineWorker);

  yield* Effect.log('Job scheduler and workers are running.');
  yield* Effect.never;
});

const runnable = program.pipe(
  Effect.provide(AppLayer),
  Effect.scoped
);

runPromise(runnable).catch(console.error);