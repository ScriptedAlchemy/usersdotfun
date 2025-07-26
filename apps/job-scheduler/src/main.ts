import { PluginLoaderLive } from '@usersdotfun/pipeline-runner';
import { Database, DatabaseLive, JobService, JobServiceLive } from '@usersdotfun/shared-db';
import { Effect, Layer } from 'effect';
import { runPromise } from "effect-errors";
import { jobs } from './jobs';
import { AppConfigLive, AppConfig } from './services/config.service';
import { QueueService, QueueServiceLive } from './services/queue.service';
import { StateServiceLive, RedisLive, RedisTag } from './services/state.service';
import { createPipelineWorker } from './workers/pipeline.worker';
import { createSourceWorker } from './workers/source.worker';

const AppLayer = Layer.mergeAll(
  AppConfigLive,
  DatabaseLive,
  JobServiceLive,
  QueueServiceLive,
  RedisLive,
  StateServiceLive,
  PluginLoaderLive
);

const program = Effect.gen(function* () {
  const queueService = yield* QueueService;
  const database = yield* Database;
  const jobService = yield* JobService;
  const appConfig = yield* AppConfig;
  const redis = yield* RedisTag;

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
    { concurrency: 'unbounded', discard: true }
  );

  yield* Effect.log('Starting workers...');
  yield* createSourceWorker;
  yield* createPipelineWorker;

  yield* Effect.log('Job scheduler and workers are running.');
  yield* Effect.never;
});

const runnable = Effect.provide(program, AppLayer).pipe(Effect.scoped);

runPromise(runnable).catch(console.error);

