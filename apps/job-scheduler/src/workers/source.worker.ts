import { EnvironmentServiceTag, getPlugin, PluginError, PluginLoaderTag, SchemaValidator } from '@usersdotfun/pipeline-runner';
import { JobService, JobNotFoundError } from '@usersdotfun/shared-db';
import { QUEUE_NAMES, QueueService, RedisKeys, StateService } from '@usersdotfun/shared-queue';
import type { JobDefinition, SourceJobData } from '@usersdotfun/shared-types/types';
import type { 
  PluginSourceItem, 
  SourceItem, 
  PlatformState, 
  PluginSourceOutput,
} from '@usersdotfun/core-sdk';
import { createSourceOutputSchema, pluginSourceItemSchema } from "@usersdotfun/core-sdk";
import { type Job } from 'bullmq';
import { Effect, Option } from 'effect';
import { randomUUID } from 'crypto';

// Use the core SDK's schema and createSourceOutputSchema
const GenericPluginSourceOutputSchema = createSourceOutputSchema(pluginSourceItemSchema);

// Type for the source configuration part of a job
interface SourceConfig {
  plugin: string;
  config: Record<string, unknown>;
  search: Record<string, unknown>;
}

// Type for the run context
interface RunContext {
  jobId: string;
  runId: string;
  jobName: string;
}

const runSourcePlugin = (
  source: SourceConfig,
  lastProcessedState: PlatformState | null,
  context: RunContext
) =>
  Effect.gen(function* () {
    const loadPlugin = yield* PluginLoaderTag;
    const environmentService = yield* EnvironmentServiceTag;

    // Get plugin metadata first for validation
    const pluginMetadata = yield* getPlugin(source.plugin);

    // 1. Validate raw config against configSchema
    const validatedRawConfig = yield* SchemaValidator.validate(
      pluginMetadata.configSchema,
      source.config,
      `${context.jobName}:config`
    );

    // 2. Hydrate secrets
    const hydratedConfig = yield* environmentService.hydrateSecrets(
      validatedRawConfig,
      pluginMetadata.configSchema
    ).pipe(
      Effect.mapError((error) => new PluginError({
        pluginName: source.plugin,
        operation: "hydrate-secrets",
        message: `Failed to hydrate secrets for plugin ${source.plugin} config: ${error.message}`,
        cause: error,
      }))
    );

    // 3. Re-validate hydrated config
    const finalValidatedConfig = yield* SchemaValidator.validate(
      pluginMetadata.configSchema,
      hydratedConfig,
      `${context.jobName}:hydrated-config`
    );

    // 4. Load plugin with validated config
    const plugin = yield* loadPlugin(source.plugin, finalValidatedConfig, pluginMetadata.version);

    if (plugin.type !== 'source') {
      return yield* Effect.fail(
        new PluginError({
          pluginName: source.plugin,
          message: `Expected source plugin, got ${plugin.type}`,
          operation: 'load',
        })
      );
    }

    // 5. Prepare and validate input
    const input = {
      searchOptions: source.search,
      lastProcessedState: lastProcessedState,
    };

    const validatedInput = yield* SchemaValidator.validate(
      pluginMetadata.inputSchema,
      input,
      `${context.jobName}:input`
    );

    // 6. Execute plugin
    const sourceResult = yield* Effect.promise(() => plugin.execute(validatedInput));

    // 7. Validate plugin output against its JSON schema
    const validatedOutput = yield* SchemaValidator.validate(
      pluginMetadata.outputSchema,
      sourceResult as Record<string, unknown>,
      `${context.jobName}:output`
    );

    if (!validatedOutput.success) {
      return yield* Effect.fail(
        new PluginError({
          pluginName: source.plugin,
          message: `Source plugin failed: ${JSON.stringify(validatedOutput.errors)}`,
          operation: 'execute',
        })
      );
    }

    // 8. Parse with our generic schema for type safety
    const parsedOutput = GenericPluginSourceOutputSchema.safeParse(validatedOutput.data);

    if (!parsedOutput.success) {
      return yield* Effect.fail(
        new PluginError({
          pluginName: source.plugin,
          message: `Source plugin output failed structural validation: ${parsedOutput.error.message}`,
          operation: 'execute',
        })
      );
    }

    const pluginOutput = parsedOutput.data;

    // 9. System enrichment: Transform PluginSourceItem[] to SourceItem[]
    const enrichedItems: SourceItem[] = (pluginOutput.data?.items ?? []).map((item) => ({
      ...item,
      id: randomUUID(), // Generate unique internal ID
      createdAt: item.createdAt ?? new Date().toISOString(), // Ensure createdAt exists
      raw: item.raw as Record<string, any>, // Cast raw to expected type
      metadata: {
        sourcePlugin: source.plugin,
        jobId: context.jobId,
        runId: context.runId,
      },
    }));

    return {
      items: enrichedItems,
      nextLastProcessedState: pluginOutput.data?.nextLastProcessedState,
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
          yield* stateService.set(RedisKeys.jobError(jobId), {
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
    yield* stateService.set(RedisKeys.jobRun(jobId, runId), {
      runId,
      status: 'running',
      startedAt: runStartTime.toISOString(),
      itemsProcessed: 0,
      itemsTotal: 0,
    });

    // Add to run history
    yield* stateService.addToRunHistory(jobId, runId);

    const lastProcessedState = yield* stateService.get(RedisKeys.jobState(jobId));
    const stateValue = Option.isSome(lastProcessedState) ? lastProcessedState.value : null;

    const sourceResult = yield* runSourcePlugin(
      jobDefinition.source,
      stateValue as PlatformState | null,
      {
        jobId: dbJob.id,
        runId,
        jobName: dbJob.name,
      }
    );

    if (sourceResult.items.length > 0) {
      yield* Effect.log(`Enqueuing ${sourceResult.items.length} items for pipeline (run: ${runId}).`);

      // Update run with total items
      yield* stateService.set(RedisKeys.jobRun(jobId, runId), {
        runId,
        status: 'processing',
        startedAt: runStartTime.toISOString(),
        itemsProcessed: 0,
        itemsTotal: sourceResult.items.length,
      });

      yield* Effect.forEach(
        sourceResult.items,
        (item, index) => queueService.add(QUEUE_NAMES.PIPELINE_JOBS, 'process-item',
          {
            jobDefinition,
            item,
            runId,
            itemIndex: index,
            sourceJobId: jobId,
            jobId: jobId
          },
          {
            attempts: 3, backoff: { type: 'exponential', delay: 2000 }
          }),
        { concurrency: 10, discard: true }
      );
    }

    if (sourceResult.nextLastProcessedState) {
      yield* Effect.log(`New state found. Re-enqueuing poll job for ${jobId}.`);
      yield* stateService.set(RedisKeys.jobState(jobId), { data: sourceResult.nextLastProcessedState });

      // Update run status
      yield* stateService.set(RedisKeys.jobRun(jobId, runId), {
        runId,
        status: 'polling',
        startedAt: runStartTime.toISOString(),
        itemsProcessed: sourceResult.items.length,
        itemsTotal: sourceResult.items.length,
        state: sourceResult.nextLastProcessedState,
      });

      yield* queueService.add(QUEUE_NAMES.SOURCE_JOBS, 'poll-source',
        { jobId },
        { delay: 5000 } // 5 second delay before polling again
      );
    } else {
      yield* Effect.log(`Polling complete for ${jobId}. Clearing state.`);
      yield* stateService.delete(RedisKeys.jobState(jobId));

      // Mark run as completed
      yield* stateService.set(RedisKeys.jobRun(jobId, runId), {
        runId,
        status: 'completed',
        startedAt: runStartTime.toISOString(),
        completedAt: new Date().toISOString(),
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

          // Default to retryable
          let shouldRetry = true;
          let errorType = 'transient';

          // Handle different error types using instanceof
          if (error instanceof PluginError && error.retryable === false) {
            yield* Effect.logError(`Configuration error for job ${job.data.jobId} - NOT RETRYING:`, error);
            shouldRetry = false;
            errorType = 'configuration';
            
            // Store configuration error state in Redis for monitoring
            yield* stateService.set(RedisKeys.jobError(job.data.jobId), {
              jobId: job.data.jobId,
              error: error.message,
              timestamp: new Date(),
              bullmqJobId: job.id,
              attemptsMade: job.attemptsMade,
              shouldRemoveFromQueue: true,
            });
          } else if (error instanceof JobNotFoundError) {
            yield* Effect.logError(`Job ${job.data.jobId} not found, likely deleted - NOT RETRYING:`, error);
            shouldRetry = false;
            errorType = 'job_not_found';
            
            // Store job not found error state in Redis for monitoring
            yield* stateService.set(RedisKeys.jobError(job.data.jobId), {
              jobId: job.data.jobId,
              error: error.message,
              timestamp: new Date(),
              bullmqJobId: job.id,
              attemptsMade: job.attemptsMade,
              shouldRemoveFromQueue: true,
            });
          } else {
            yield* Effect.logError(`Source job ${job.data.jobId} failed with a transient error - will retry:`, error);
            errorType = 'transient';
          }

          // Update job status to failed, unless it was a JobNotFoundError
          if (!(error instanceof JobNotFoundError)) {
            yield* jobService.updateJob(job.data.jobId, { status: 'failed' }).pipe(
              Effect.catchAll(() => Effect.void) // Ignore update failures
            );
          }

          // If the error is not retryable, we consume it and return Effect.void
          // to signal success to BullMQ and stop retries.
          // Otherwise, we re-throw it by returning Effect.fail(error).
          if (!shouldRetry) {
            yield* Effect.log(`Job ${job.data.jobId} permanently failed due to ${errorType} error - stopping retries`);
            return yield* Effect.void; // Stop the job permanently
          } else {
            return yield* Effect.fail(error); // Allow BullMQ to retry
          }
        })
      )
    );

export const createSourceWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;

  yield* queueService.createWorker(QUEUE_NAMES.SOURCE_JOBS, (job: Job<SourceJobData>) => {
    // Handle both scheduled and immediate jobs
    if (job.name === 'scheduled-source-run' || job.name === 'immediate-source-run' || job.name === 'poll-source') {
      return processSourceJob(job);
    } else {
      return Effect.logWarning(`Unknown job type: ${job.name}`);
    }
  });
});
