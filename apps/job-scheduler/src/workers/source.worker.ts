import { getPlugin, PluginError, PluginLoaderTag, SchemaValidator } from '@usersdotfun/pipeline-runner';
import { JobService } from '@usersdotfun/shared-db';
import { type Job } from 'bullmq';
import { Effect, Option } from 'effect';
import { getJobDefinitionById, type JobDefinition } from '../jobs';
import { QueueService, StateService, type SourceJobData } from '../services/index';

interface SourceOutput {
  items: any[];
  nextLastProcessedState?: unknown | null;
}

const runSourcePlugin = (jobDefinition: JobDefinition, lastProcessedState: any) =>
  Effect.gen(function* () {
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
          message: `Source plugin failed: ${JSON.stringify(validatedOutput.errors)}`,
          operation: 'execute',
        })
      );
    }

    const sourceData = validatedOutput.data as SourceOutput;
    return {
      items: sourceData?.items ?? [],
      nextLastProcessedState: sourceData?.nextLastProcessedState,
    };
  });

const processSourceJob = (job: Job<SourceJobData>) =>
  Effect.gen(function* () {
    const { jobId } = job.data;
    const jobDefinition = yield* getJobDefinitionById(jobId);

    const stateService = yield* StateService;
    const queueService = yield* QueueService;
    const jobService = yield* JobService;

    yield* Effect.log(`Processing source job: ${jobId} (attempt ${job.attemptsMade + 1})`);
    yield* jobService.updateJob(jobId, { status: 'processing' });

    const lastProcessedState = yield* stateService.get(jobId);
    const stateValue = Option.isSome(lastProcessedState) ? lastProcessedState.value : null;

    const sourceResult = yield* runSourcePlugin(jobDefinition, stateValue);

    if (sourceResult.items.length > 0) {
      yield* Effect.log(`Enqueuing ${sourceResult.items.length} items for pipeline.`);
      yield* Effect.forEach(
        sourceResult.items,
        item => queueService.add('pipeline-jobs', 'process-item',
          { jobDefinition, item },
          {
            attempts: 3, backoff: { type: 'exponential', delay: 2000 }
          }),
        { concurrency: 10, discard: true }
      );
    }

    if (sourceResult.nextLastProcessedState) {
      yield* Effect.log(`New state found. Re-enqueuing poll job for ${jobId}.`);
      yield* stateService.set(jobId, sourceResult.nextLastProcessedState);
      yield* queueService.add('source-jobs', 'poll-source',
        { jobId },
        { delay: 5000 } // 5 second delay before polling again
      );
    } else {
      yield* Effect.log(`Polling complete for ${jobId}. Clearing state.`);
      yield* stateService.delete(jobId);
      yield* jobService.updateJob(jobId, { status: 'completed' });
    }
  })
    .pipe(
      Effect.catchAll(error =>
        Effect.gen(function* () {
          const jobService = yield* JobService;
          yield* jobService.updateJob(job.data.jobId, { status: 'failed' });
          yield* Effect.logError("Source job failed", error);

          // Re-throw to let BullMQ handle retries
          return yield* Effect.fail(error);
        })
      )
    );

export const createSourceWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;

  yield* queueService.createWorker('source-jobs', (job: Job<SourceJobData>) =>
    processSourceJob(job)
  );
});