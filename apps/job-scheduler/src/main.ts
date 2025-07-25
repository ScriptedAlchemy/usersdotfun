import { PluginLoaderLive } from '@usersdotfun/pipeline-runner';
import { Effect, Layer, pipe } from 'effect';
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
  AppConfigLive
);

const program = Effect.gen(function* () {
  const queueService = yield* QueueService;

  yield* Effect.log('Scheduling jobs...');
  yield* Effect.forEach(
    jobs,
    job => queueService.addRepeatable(
      'source-jobs',
      'scheduled-source-run',
      { jobId: job.id },
      { pattern: job.schedule }
    ),
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
  Effect.provide(AppLive)
);

Effect.runPromise(runnable).catch(console.error);
