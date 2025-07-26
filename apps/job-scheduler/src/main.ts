import { PluginLoaderLive } from '@usersdotfun/pipeline-runner';
import { DatabaseLive, JobService, JobServiceLive } from '@usersdotfun/shared-db';
import { Effect, Layer, pipe } from 'effect';
import { runPromise } from "effect-errors";
import { jobs } from './jobs';
import { AppConfigLive } from './services/config.service';
import { QueueService, QueueServiceLive } from './services/queue.service';
import { StateServiceLive } from './services/state.service';
import { createPipelineWorker } from './workers/pipeline.worker';
import { createSourceWorker } from './workers/source.worker';

const AppLive = Layer.mergeAll(
  QueueServiceLive,
  StateServiceLive,
  PluginLoaderLive,
  AppConfigLive,
  JobServiceLive,
  DatabaseLive
);

const program = Effect.gen(function* () {
  const queueService = yield* QueueService;
  const jobService = yield* JobService;

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

const runnable = pipe(
  program,
  Effect.provide(AppLive),
  Effect.scoped
);

runPromise(runnable).catch(console.error);
