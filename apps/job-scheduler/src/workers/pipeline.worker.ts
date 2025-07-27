import { executePipeline } from '@usersdotfun/pipeline-runner';
import { JobService } from '@usersdotfun/shared-db';
import { type Job } from 'bullmq';
import { Effect, pipe } from 'effect';
import { QueueService, type PipelineJobData } from '../services/index';

const processPipelineJob = (job: Job<PipelineJobData>) =>
  pipe(
    Effect.log(`Processing pipeline for item: ${JSON.stringify(job.data.item)}`),
    Effect.flatMap(() =>
      executePipeline(
        job.data.jobDefinition.pipeline,
        job.data.item,
        job.data.jobDefinition.id
      )
    ),
    Effect.tap((result) =>
      Effect.log(`Pipeline completed with result: ${JSON.stringify(result)}`)
    ),
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        const jobService = yield* JobService;
        yield* jobService.updateJob(job.data.jobDefinition.id, { status: 'failed' });
        yield* Effect.logError("Pipeline job failed", error);
      })
    )
  );

export const createPipelineWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;

  yield* queueService.createWorker('pipeline-jobs', (job: Job<PipelineJobData>) =>
    processPipelineJob(job)
  );
});