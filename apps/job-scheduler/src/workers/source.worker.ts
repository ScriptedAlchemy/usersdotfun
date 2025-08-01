import type {
  LastProcessedState,
  PlatformState,
  SourceItem
} from '@usersdotfun/core-sdk';
import { createSourceOutputSchema } from "@usersdotfun/core-sdk";
import { EnvironmentServiceTag, getPlugin, PluginError, PluginLoaderTag, SchemaValidator } from '@usersdotfun/pipeline-runner';
import { WorkflowNotFoundError, WorkflowService } from '@usersdotfun/shared-db';
import { QUEUE_NAMES, QueueService, RedisKeys, StateService } from '@usersdotfun/shared-queue';
import type { Workflow, SourceJobData } from '@usersdotfun/shared-types/types';
import { type Job } from 'bullmq';
import { randomUUID } from 'crypto';
import { Effect, Option } from 'effect';
import { z } from 'zod';

const GenericPluginSourceOutputSchema = createSourceOutputSchema(z.unknown());

// Type for the source configuration part of a job
interface SourceConfig {
  plugin: string;
  config: Record<string, unknown>;
  search: Record<string, unknown>;
}

// Type for the run context
interface RunContext {
  workflowId: string;
  runId: string;
  jobName: string;
}

const runSourcePlugin = (
  source: SourceConfig,
  lastProcessedState: LastProcessedState<PlatformState> | null,
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
    const parsedOutput = GenericPluginSourceOutputSchema.safeParse(validatedOutput);

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
        workflowId: context.workflowId,
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
    const { workflowId } = job.data;

    const stateService = yield* StateService;
    const queueService = yield* QueueService;
    const workflowService = yield* WorkflowService;

    const workflowRun = yield* workflowService.createWorkflowRun({ workflowId });
    const { id: runId } = workflowRun;

    // Get workflow from database
    const dbWorkflow = yield* workflowService.getWorkflowById(workflowId).pipe(
      Effect.catchTag('WorkflowNotFoundError', (error) =>
        Effect.gen(function* () {
          yield* Effect.log(`Workflow ${workflowId} not found in database. This may be a deleted workflow with an orphaned BullMQ repeatable job.`);

          // Store error state in Redis for monitoring
          yield* stateService.set(RedisKeys.runSummary(workflowId, runId), {
            runId,
            status: 'failed',
            error: 'Workflow not found in database',
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            itemsProcessed: 0,
            itemsTotal: 0,
          });

          // Don't retry - this job should be removed from BullMQ
          return yield* Effect.fail(new Error(`Workflow ${workflowId} not found in database - likely deleted`));
        })
      )
    );
    const workflow: Workflow = {
      id: dbWorkflow.id,
      name: dbWorkflow.name,
      schedule: dbWorkflow.schedule ?? undefined,
      source: {
        plugin: dbWorkflow.sourcePlugin,
        config: dbWorkflow.sourceConfig,
        search: dbWorkflow.sourceSearch,
      },
      pipeline: dbWorkflow.pipeline,
    };

    const runStartTime = new Date();

    yield* Effect.log(`Processing source job for workflow: ${workflowId} (run: ${runId}, attempt ${job.attemptsMade + 1})`);
    yield* workflowService.updateWorkflow(workflowId, { status: 'processing' });

    // Store run information
    yield* stateService.set(RedisKeys.runSummary(workflowId, runId), {
      runId,
      status: 'running',
      startedAt: runStartTime.toISOString(),
      itemsProcessed: 0,
      itemsTotal: 0,
    });

    // Add to run history
    yield* stateService.addToRunHistory(workflowId, runId);

    const lastProcessedState = yield* stateService.get(RedisKeys.workflowState<LastProcessedState>(workflowId));
    const stateValue = Option.isSome(lastProcessedState) ? lastProcessedState.value : null;

    const sourceResult = yield* runSourcePlugin(
      workflow.source,
      stateValue,
      {
        workflowId: workflowId,
        runId,
        jobName: dbWorkflow.name,
      }
    );

    if (sourceResult.items.length > 0) {
      yield* Effect.log(`Enqueuing ${sourceResult.items.length} items for pipeline (run: ${runId}).`);

      // Update run with total items
      yield* stateService.set(RedisKeys.runSummary(workflowId, runId), {
        runId,
        status: 'processing',
        startedAt: runStartTime.toISOString(),
        itemsProcessed: 0,
        itemsTotal: sourceResult.items.length,
      });

      yield* Effect.forEach(
        sourceResult.items,
        (item, index) => Effect.gen(function* () {
          // For each item, it calls workflowService.upsertSourceItem(...)
          yield* workflowService.upsertSourceItem({
            workflowId,
            sourceId: item.id,
            data: item.raw,
            hash: '', // Placeholder for hash
          });

          // Enqueue jobs to the pipeline-jobs queue with runId
          yield* queueService.add(QUEUE_NAMES.PIPELINE_JOBS, 'process-item',
            {
              workflow,
              item,
              runId,
              itemIndex: index,
              sourceJobId: workflowId,
              workflowId: workflowId
            },
            {
              attempts: 3, backoff: { type: 'exponential', delay: 2000 }
            });
        }),
        { concurrency: 10, discard: true }
      );
    }

    if (sourceResult.nextLastProcessedState) {
      yield* Effect.log(`New state found. Re-enqueuing poll job for ${workflowId}.`);

      const wrappedState: LastProcessedState<PlatformState> = {
        data: sourceResult.nextLastProcessedState
      };

      yield* stateService.set(RedisKeys.workflowState(workflowId), wrappedState);

      // Update run status
      yield* stateService.set(RedisKeys.runSummary(workflowId, runId), {
        runId,
        status: 'polling',
        startedAt: runStartTime.toISOString(),
        itemsProcessed: sourceResult.items.length,
        itemsTotal: sourceResult.items.length,
        state: sourceResult.nextLastProcessedState,
      });

      const delay = sourceResult.nextLastProcessedState.currentAsyncJob ? 60000 : 300000; // 1 min if active job, 5 min otherwise
      yield* queueService.add(QUEUE_NAMES.SOURCE_JOBS, 'poll-source',
        { workflowId },
        { delay }
      );
    } else {
      yield* Effect.log(`Polling complete for ${workflowId}. Clearing state.`);
      yield* stateService.delete(RedisKeys.workflowState(workflowId));

      // Mark run as completed
      yield* stateService.set(RedisKeys.runSummary(workflowId, runId), {
        runId,
        status: 'completed',
        startedAt: runStartTime.toISOString(),
        completedAt: new Date().toISOString(),
        itemsProcessed: sourceResult.items.length,
        itemsTotal: sourceResult.items.length,
      });

      yield* workflowService.updateWorkflow(workflowId, { status: 'completed' });
    }
  })
    .pipe(
      Effect.catchAll(error =>
        Effect.gen(function* () {
          const stateService = yield* StateService;
          const workflowService = yield* WorkflowService;
          const { workflowId } = job.data;
          // We may not have a runId if createWorkflowRun failed, so we generate a temporary one for logging
          const runId = (job.data as any).runId ?? `failed-run-${Date.now()}`;

          // Default to retryable
          let shouldRetry = true;
          let errorType = 'transient';

          // Handle different error types using instanceof
          if (error instanceof PluginError && error.retryable === false) {
            yield* Effect.logError(`Configuration error for workflow ${workflowId} - NOT RETRYING:`, error);
            shouldRetry = false;
            errorType = 'configuration';

            // Store configuration error state in Redis for monitoring
            yield* stateService.set(RedisKeys.runSummary(workflowId, runId), {
              runId,
              status: 'failed',
              error: `Configuration error: ${error.message}`,
              startedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              itemsProcessed: 0,
              itemsTotal: 0,
            });
          } else if (error instanceof WorkflowNotFoundError) {
            yield* Effect.logError(`Workflow ${workflowId} not found, likely deleted - NOT RETRYING:`, error);
            shouldRetry = false;
            errorType = 'workflow_not_found';

            // State is already set in the catchTag for WorkflowNotFoundError
          } else {
            yield* Effect.logError(`Source job for workflow ${workflowId} failed with a transient error - will retry:`, error);
            errorType = 'transient';
          }

          // Update workflow status to failed
          if (!(error instanceof WorkflowNotFoundError)) {
            yield* workflowService.updateWorkflow(workflowId, { status: 'failed' }).pipe(
              Effect.catchAll(() => Effect.void) // Ignore update failures
            );
          }

          // If the error is not retryable, we consume it and return Effect.void
          // to signal success to BullMQ and stop retries.
          // Otherwise, we re-throw it by returning Effect.fail(error).
          if (!shouldRetry) {
            yield* Effect.log(`Workflow ${workflowId} permanently failed due to ${errorType} error - stopping retries`);
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
