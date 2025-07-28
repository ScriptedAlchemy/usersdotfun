import { BunTerminal } from "@effect/platform-bun";
import { PluginLoaderLive, StateServiceTag } from '@usersdotfun/pipeline-runner';
import { Database, DatabaseLive, DatabaseConfig, JobService, JobServiceLive } from '@usersdotfun/shared-db';
import { RedisConfigLive, RedisAppConfig, StateService, StateServiceLive, QueueService, QueueServiceLive } from '@usersdotfun/shared-queue';
import { Effect, Layer, Logger, LogLevel, ConfigProvider, Redacted } from 'effect';
import { runPromise } from "effect-errors";
import { jobs } from './jobs';
import { AppConfig, AppConfigLive } from './config';
import { createPipelineWorker } from './workers/pipeline.worker';
import { createSourceWorker } from './workers/source.worker';

// Step 1: Base layers
const ConfigLayer = AppConfigLive.pipe(
  Layer.provide(Layer.setConfigProvider(ConfigProvider.fromEnv()))
);

const LoggingLayer = Layer.mergeAll(
  BunTerminal.layer,
  Logger.pretty,
  Logger.minimumLogLevel(LogLevel.Info)
);

// Step 2: Bridge layers - these depend on ConfigLayer
const DatabaseConfigLayer = Layer.effect(
  DatabaseConfig,
  Effect.gen(function* () {
    const appConfig = yield* AppConfig;
    return { 
      connectionString: Redacted.value(appConfig.databaseUrl)
    };
  })
).pipe(
  Layer.provide(ConfigLayer)
);

const RedisAppConfigLayer = Layer.effect(
  RedisAppConfig,
  Effect.gen(function* () {
    const appConfig = yield* AppConfig;
    return { redisUrl: appConfig.redisUrl };
  })
).pipe(
  Layer.provide(ConfigLayer)
);

// Step 3: Infrastructure layers - these depend on bridge layers
const DatabaseLayer = DatabaseLive.pipe(
  Layer.provide(DatabaseConfigLayer)
);

const RedisLayer = RedisConfigLive.pipe(
  Layer.provide(RedisAppConfigLayer)
);

// Step 4: Service layers - these depend on infrastructure
const QueueServiceLayer = QueueServiceLive.pipe(
  Layer.provide(RedisLayer)
);

const StateServiceLayer = StateServiceLive.pipe(
  Layer.provide(RedisLayer)
);

const JobServiceLayer = JobServiceLive.pipe(
  Layer.provide(DatabaseLayer)
);

const PluginServiceLayer = PluginLoaderLive;

// Step 5: Pipeline bridge layer - depends on StateService
const PipelineStateServiceLayer = Layer.effect(
  StateServiceTag,
  Effect.gen(function* () {
    return yield* StateService;
  })
).pipe(
  Layer.provide(StateServiceLayer)
);

// Step 6: Final composition - merge all resolved layers
const AppLayer = Layer.mergeAll(
  ConfigLayer,
  LoggingLayer,
  DatabaseLayer,
  RedisLayer,
  QueueServiceLayer,
  StateServiceLayer,
  JobServiceLayer,
  PluginServiceLayer,
  PipelineStateServiceLayer
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