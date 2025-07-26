import { executePipeline, PluginLoaderLive } from '@usersdotfun/pipeline-runner';
import { JobServiceLive } from '@usersdotfun/shared-db';
import { type Job } from 'bullmq';
import { Effect, Layer, pipe } from 'effect';
import { DatabaseLive } from '~/db';
import { QueueService, type PipelineJobData } from '../services/index';

const PipelineWorkerLive = Layer.mergeAll(
    PluginLoaderLive,
    JobServiceLive,
    DatabaseLive
);

const processPipelineJob = (job: Job<PipelineJobData>) =>
  pipe(
    Effect.log(`Processing pipeline for item: ${JSON.stringify(job.data.item)}`),
    Effect.flatMap(() => executePipeline(job.data.jobDefinition.pipeline, job.data.item, job.data.jobDefinition.id)),
    Effect.tap((result) => Effect.log(`Pipeline completed with result: ${JSON.stringify(result)}`)),
    Effect.map(() => { }), // Convert to void
    Effect.catchAll((error) =>
      pipe(
        Effect.logError("Pipeline job failed", error),
        Effect.map(() => { })
      )
    )
  );

const isPipelineJob = (job: Job<any>): job is Job<PipelineJobData> => {
  return 'jobDefinition' in job.data && 'item' in job.data;
}

export const createPipelineWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;

  yield* queueService.createWorker('pipeline-jobs', (job) => {
    if (!isPipelineJob(job)) {
      return Promise.resolve();
    }

    return Effect.runPromise(
      pipe(
        processPipelineJob(job),
        Effect.provide(PipelineWorkerLive)
      )
    );
  });
});
