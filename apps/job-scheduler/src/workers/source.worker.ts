import { getPlugin, PluginError, PluginLoaderLive, PluginLoaderTag, SchemaValidator } from '@usersdotfun/pipeline-runner';
import { JobService } from '@usersdotfun/shared-db';
import { type Job } from 'bullmq';
import { Effect, Layer, pipe } from 'effect';
import { getJobDefinitionById, type JobDefinition } from '../jobs';
import { QueueService, StateService, type SourceJobData } from '../services/index';

interface SourceOutput {
  items: any[];
  nextLastProcessedState?: unknown | null;
}

const runSourcePlugin = (jobDefinition: JobDefinition, lastProcessedState: any) => Effect.gen(function* () {
  const loadPlugin = yield* PluginLoaderTag;
  const plugin = yield* loadPlugin(jobDefinition.source.plugin, jobDefinition.source.config);

  if (plugin.type !== 'source') {
    return yield* Effect.fail(
      new PluginError({
        pluginName: jobDefinition.source.plugin,
        message: `Expected source plugin, got ${plugin.type}`,
        operation: 'load',
      })
    );
  }

  const pluginMetadata = yield* getPlugin(jobDefinition.source.plugin);

  const input = {
    searchOptions: jobDefinition.source.search,
    lastProcessedState: lastProcessedState,
  };

  yield* SchemaValidator.validate(
    pluginMetadata.inputSchema,
    input,
    `${jobDefinition.name}:input`
  );

  const sourceResult = yield* Effect.tryPromise({
    try: () => plugin.execute(input),
    catch: (error) =>
      new PluginError({
        pluginName: jobDefinition.source.plugin,
        cause: error,
        operation: 'execute',
        message: 'Source plugin execution failed',
      }),
  });

  const validatedOutput = yield* SchemaValidator.validate(
    pluginMetadata.outputSchema,
    sourceResult as Record<string, unknown>,
    `${jobDefinition.name}:output`
  );

  if (!validatedOutput.success) {
    return yield* Effect.fail(
      new PluginError({
        pluginName: jobDefinition.source.plugin,
        message: `Source plugin failed: ${JSON.stringify(
          validatedOutput.errors
        )}`,
        operation: 'execute',
      })
    );
  }

  const sourceData = validatedOutput.data as SourceOutput;
  const items = sourceData?.items ?? [];
  const nextLastProcessedState = sourceData?.nextLastProcessedState;

  return {
    items,
    nextLastProcessedState,
  };
});

import { QueueServiceLive, StateServiceLive } from '../services/index';

const SourceWorkerLive = Layer.mergeAll(
  QueueServiceLive,
  StateServiceLive,
  PluginLoaderLive
);

const processSourceJob = (job: Job<SourceJobData>) =>
  pipe(
    Effect.succeed(job.data.jobId),
    Effect.tap((jobId) => Effect.log(`Processing source job: ${jobId}`)),
    Effect.flatMap((jobId: string) =>
      Effect.all({
        jobId: Effect.succeed(jobId),
        jobDefinition: getJobDefinitionById(jobId),
        stateService: StateService,
        queueService: QueueService,
      })
    ),
    Effect.flatMap(({ jobId, jobDefinition, stateService, queueService }) =>
      Effect.gen(function* () {
        const jobService = yield* JobService;
        yield* jobService.updateJob(jobId, { status: 'processing' });
        const lastProcessedState = yield* stateService.get(jobId);
        const sourceResult = yield* runSourcePlugin(jobDefinition, lastProcessedState);

        if (sourceResult.items.length > 0) {
          yield* Effect.log(`Enqueuing ${sourceResult.items.length} items for pipeline.`);
          yield* Effect.forEach(
            sourceResult.items,
            item => queueService.add('pipeline-jobs', 'process-item', { jobDefinition, item }),
            { concurrency: 'unbounded', discard: true }
          );
        }

        if (sourceResult.nextLastProcessedState) {
          yield* Effect.log(`New state found. Re-enqueuing poll job for ${jobId}.`);
          yield* stateService.set(jobId, sourceResult.nextLastProcessedState);
          yield* queueService.add('source-jobs', 'poll-source', { jobId });
        } else {
          yield* Effect.log(`Polling complete for ${jobId}. Clearing state.`);
          yield* stateService.delete(jobId);
          yield* jobService.updateJob(jobId, { status: 'completed' });
        }
      })
    ),
    Effect.map(() => { }), // Convert to void
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        const jobService = yield* JobService;
        const jobData = yield* Effect.succeed(job.data.jobId);
        yield* jobService.updateJob(jobData, { status: 'failed' });
        yield* Effect.logError("Source job failed", error)
      }).pipe(
        Effect.provide(JobService),
        Effect.map(() => {})
      )
    )
  );

const isSourceJob = (job: Job<any>): job is Job<SourceJobData> => {
  return 'jobId' in job.data;
}

// This would be called from main.ts to start the worker
export const createSourceWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;

  yield* queueService.createWorker('source-jobs', (job) => {
    if (!isSourceJob(job)) {
      return Promise.resolve();
    }
    return Effect.runPromise(
      pipe(
        processSourceJob(job),
        Effect.provide(SourceWorkerLive)
      )
    )
  });
});
