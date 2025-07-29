import { getPlugin, PluginError, PluginLoaderTag, SchemaValidator, EnvironmentServiceTag, type EnvironmentService } from '@usersdotfun/pipeline-runner';
import { JobService } from '@usersdotfun/shared-db';
import { QueueService, StateService, type SourceJobData } from '@usersdotfun/shared-queue';
import { type Job } from 'bullmq';
import { Effect, Option } from 'effect';
import type { JobDefinition } from '@usersdotfun/shared-types';
interface SourceOutput {
  items: any[];
  nextLastProcessedState?: unknown | null;
}

const runSourcePlugin = (jobDefinition: JobDefinition, lastProcessedState: any) =>
  Effect.gen(function* () {
    const loadPlugin = yield* PluginLoaderTag;
    const environmentService = yield* EnvironmentServiceTag;
    
    // Get plugin metadata first for validation
    const pluginMetadata = yield* getPlugin(jobDefinition.source.plugin);

    // 1. Validate raw config against configSchema
    const validatedRawConfig = yield* SchemaValidator.validate(
      pluginMetadata.configSchema,
      jobDefinition.source.config,
      `${jobDefinition.name}:config`
    );

    // 2. Hydrate secrets
    const hydratedConfig = yield* environmentService.hydrateSecrets(
      validatedRawConfig,
      pluginMetadata.configSchema
    ).pipe(
      Effect.mapError((error) => new PluginError({
        pluginName: jobDefinition.source.plugin,
        operation: "hydrate-secrets",
        message: `Failed to hydrate secrets for plugin ${jobDefinition.source.plugin} config: ${error.message}`,
        cause: error,
      }))
    );

    // 3. Re-validate hydrated config
    const finalValidatedConfig = yield* SchemaValidator.validate(
      pluginMetadata.configSchema,
      hydratedConfig,
      `${jobDefinition.name}:hydrated-config`
    );

    // 4. Load plugin with validated config
    const plugin = yield* loadPlugin(jobDefinition.source.plugin, finalValidatedConfig, pluginMetadata.version);

    if (plugin.type !== 'source') {
      return yield* Effect.fail(
        new PluginError({
          pluginName: jobDefinition.source.plugin,
          message: `Expected source plugin, got ${plugin.type}`,
          operation: 'load',
        })
      );
    }
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

    const stateService = yield* StateService;
    const queueService = yield* QueueService;
    const jobService = yield* JobService;

    // Get job from database and map to JobDefinition
    const dbJob = yield* jobService.getJobById(jobId).pipe(
      Effect.catchTag('JobNotFoundError', (error) =>
        Effect.gen(function* () {
          yield* Effect.log(`Job ${jobId} not found in database. This may be a deleted job with orphaned BullMQ repeatable job.`);

          // Store error state in Redis for monitoring
          yield* stateService.set(`job-error:${jobId}`, {
            jobId,
            error: 'Job not found in database',
            timestamp: new Date(),
            bullmqJobId: job.id,
            attemptsMade: job.attemptsMade,
          });

          // Don't retry - this job should be removed from BullMQ
          return yield* Effect.fail(new Error(`Job ${jobId} not found in database - likely deleted`));
        })
      )
    );
    const jobDefinition: JobDefinition = {
      id: dbJob.id,
      name: dbJob.name,
      schedule: dbJob.schedule ?? undefined,
      source: {
        plugin: dbJob.sourcePlugin,
        config: dbJob.sourceConfig,
        search: dbJob.sourceSearch,
      },
      pipeline: dbJob.pipeline,
    };

    // Generate unique run ID for this execution
    const runId = `${jobId}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const runStartTime = new Date();

    yield* Effect.log(`Processing source job: ${jobId} (run: ${runId}, attempt ${job.attemptsMade + 1})`);
    yield* jobService.updateJob(jobId, { status: 'processing' });

    // Store run information
    yield* stateService.set(`job-run:${jobId}:${runId}`, {
      runId,
      jobId,
      status: 'running',
      startedAt: runStartTime,
      itemsProcessed: 0,
      itemsTotal: 0,
    });

    // Add to run history
    yield* stateService.addToRunHistory(jobId, runId);

    const lastProcessedState = yield* stateService.get(jobId);
    const stateValue = Option.isSome(lastProcessedState) ? lastProcessedState.value : null;

    const sourceResult = yield* runSourcePlugin(jobDefinition, stateValue);

    if (sourceResult.items.length > 0) {
      yield* Effect.log(`Enqueuing ${sourceResult.items.length} items for pipeline (run: ${runId}).`);

      // Update run with total items
      yield* stateService.set(`job-run:${jobId}:${runId}`, {
        runId,
        jobId,
        status: 'processing',
        startedAt: runStartTime,
        itemsProcessed: 0,
        itemsTotal: sourceResult.items.length,
      });

      yield* Effect.forEach(
        sourceResult.items,
        (item, index) => queueService.add('pipeline-jobs', 'process-item',
          {
            jobDefinition,
            item,
            runId,
            itemIndex: index,
            sourceJobId: jobId
          },
          {
            attempts: 3, backoff: { type: 'exponential', delay: 2000 }
          }),
        { concurrency: 10, discard: true }
      );
    }

    if (sourceResult.nextLastProcessedState) {
      yield* Effect.log(`New state found. Re-enqueuing poll job for ${jobId}.`);
      yield* stateService.set(jobId, sourceResult.nextLastProcessedState);

      // Update run status
      yield* stateService.set(`job-run:${jobId}:${runId}`, {
        runId,
        jobId,
        status: 'polling',
        startedAt: runStartTime,
        itemsProcessed: sourceResult.items.length,
        itemsTotal: sourceResult.items.length,
        nextState: sourceResult.nextLastProcessedState,
      });

      yield* queueService.add('source-jobs', 'poll-source',
        { jobId },
        { delay: 5000 } // 5 second delay before polling again
      );
    } else {
      yield* Effect.log(`Polling complete for ${jobId}. Clearing state.`);
      yield* stateService.delete(jobId);

      // Mark run as completed
      yield* stateService.set(`job-run:${jobId}:${runId}`, {
        runId,
        jobId,
        status: 'completed',
        startedAt: runStartTime,
        completedAt: new Date(),
        itemsProcessed: sourceResult.items.length,
        itemsTotal: sourceResult.items.length,
      });

      yield* jobService.updateJob(jobId, { status: 'completed' });
    }
  })
    .pipe(
      Effect.catchAll(error =>
        Effect.gen(function* () {
          const stateService = yield* StateService;
          const jobService = yield* JobService;

          // Handle JobNotFoundError differently - don't try to update non-existent job
          if (error.message?.includes('not found in database')) {
            yield* Effect.logError(`Skipping job update for deleted job ${job.data.jobId}:`, error);

            // Store failure state in Redis for monitoring
            yield* stateService.set(`job-error:${job.data.jobId}`, {
              jobId: job.data.jobId,
              error: error.message,
              timestamp: new Date(),
              bullmqJobId: job.id,
              attemptsMade: job.attemptsMade,
              shouldRemoveFromQueue: true,
            });

            // Don't retry for deleted jobs
            return yield* Effect.fail(error);
          }

          // For other errors, try to update job status
          yield* jobService.updateJob(job.data.jobId, { status: 'failed' }).pipe(
            Effect.catchAll(() => Effect.void) // Ignore update failures
          );

          yield* Effect.logError("Source job failed", error);

          // Re-throw to let BullMQ handle retries
          return yield* Effect.fail(error);
        })
      )
    );

export const createSourceWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;

  yield* queueService.createWorker('source-jobs', (job: Job<SourceJobData>) => {
    // Handle both scheduled and immediate jobs
    if (job.name === 'scheduled-source-run' || job.name === 'immediate-source-run' || job.name === 'poll-source') {
      return processSourceJob(job);
    } else {
      return Effect.logWarning(`Unknown job type: ${job.name}`);
    }
  });
});
