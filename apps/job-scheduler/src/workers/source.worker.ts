import { type SourcePlugin, createSourceOutputSchema, type LastProcessedState, type PlatformState } from '@usersdotfun/core-sdk';
import { PluginService } from '@usersdotfun/pipeline-runner';
import { WorkflowService } from '@usersdotfun/shared-db';
import { QueueService } from '@usersdotfun/shared-queue';
import { QUEUE_NAMES, type SourceQueryJobData, type ExecutePipelineJobData } from '@usersdotfun/shared-types/types';
import { type Job } from 'bullmq';
import { Effect } from 'effect';
import { z } from 'zod';

// Create a specific schema for parsing source plugin output
const GenericPluginSourceOutputSchema = createSourceOutputSchema(z.unknown());

const processSourceQueryJob = (job: Job<SourceQueryJobData>) =>
  Effect.gen(function* () {
    const { workflowId, workflowRunId, data } = job.data;
    if (!workflowRunId) {
      return yield* Effect.fail(new Error("workflowRunId is required for source query jobs"));
    }
    const { lastProcessedState } = data;
    const workflowService = yield* WorkflowService;
    const queueService = yield* QueueService;
    const pluginService = yield* PluginService;

    yield* Effect.log(`Processing source query job for workflow: ${workflowId}, run: ${workflowRunId}`);

    const workflow = yield* workflowService.getWorkflowById(workflowId);
    const input = {
      searchOptions: workflow.source.search,
      lastProcessedState: lastProcessedState ?? null,
    };

    const pluginRun = yield* workflowService.createPluginRun({
      workflowRunId,
      pluginId: workflow.source.pluginId,
      config: workflow.source.config,
      status: 'RUNNING',
      input,
      startedAt: new Date(),
      stepId: 'source',
      sourceItemId: null,
    });

    const pluginEffect = Effect.gen(function* () {
      const execute = Effect.acquireUseRelease(
        pluginService.initializePlugin<SourcePlugin>(
          workflow.source,
          `Source Query for Workflow "${workflow.name}" [${workflowRunId}]`
        ),
        (sourcePlugin) =>
          pluginService.executePlugin(
            sourcePlugin,
            input,
            `Source Query for Workflow "${workflow.name}" [${workflowRunId}]`
          ),
        () => Effect.void
      );

      const rawOutput = yield* execute;

      const parseResult = GenericPluginSourceOutputSchema.safeParse(rawOutput);
      if (!parseResult.success) {
        const error = new Error(`Source plugin output validation failed: ${parseResult.error.message}`);
        yield* workflowService.updatePluginRun(pluginRun.id, {
          status: 'FAILED',
          error: { message: error.message },
          completedAt: new Date(),
        });
        return yield* Effect.fail(error);
      }

      const output = parseResult.data;
      if (!output.success || !output.data) {
        const error = new Error('Source plugin failed to return data');
        yield* workflowService.updatePluginRun(pluginRun.id, {
          status: 'FAILED',
          error: output.errors,
          completedAt: new Date(),
        });
        return yield* Effect.fail(error);
      }

      yield* workflowService.updatePluginRun(pluginRun.id, {
        status: 'COMPLETED',
        output,
        completedAt: new Date(),
      });

      return output.data;
    }).pipe(
      Effect.catchAll((error) =>
        Effect.gen(function* () {
          yield* workflowService.updatePluginRun(pluginRun.id, {
            status: "FAILED",
            error: {
              message: "Failed to execute source plugin",
              cause: error,
            },
            completedAt: new Date(),
          });
          return yield* Effect.fail(error);
        })
      )
    );

    const { items, nextLastProcessedState } = yield* pluginEffect;

    yield* workflowService.updateWorkflowRun(workflowRunId, { itemsTotal: items.length });

    const processingEffect = Effect.gen(function* () {
      if (items.length > 0) {
        yield* Effect.log(`Enqueuing ${items.length} items for pipeline processing`);

        yield* Effect.forEach(
          items,
          (item) =>
            Effect.gen(function* () {
              const sourceItem = yield* workflowService.upsertSourceItem({
                workflowId,
                externalId: item.externalId,
                data: item,
                processedAt: null,
              });

              const pipelineJobData: ExecutePipelineJobData = {
                workflowId,
                workflowRunId,
                data: {
                  sourceItemId: sourceItem.id,
                  input: item.raw as Record<string, unknown>,
                }
              };

              yield* queueService.add(
                QUEUE_NAMES.PIPELINE_EXECUTION,
                `process-item`,
                pipelineJobData
              );
            }),
          { concurrency: 10, discard: true }
        );
      }
    });

    yield* processingEffect.pipe(
      Effect.catchAll((error) =>
        Effect.gen(function* () {
          yield* workflowService.updatePluginRun(pluginRun.id, {
            status: "FAILED",
            error: {
              message: "Failed to process source items",
              cause: error,
            },
            completedAt: new Date(),
          });
          return yield* Effect.fail(error);
        })
      )
    );


    if (nextLastProcessedState) {
      yield* Effect.log(`More data available. Enqueueing follow-up source query for workflow ${workflowId}`);
      
      yield* workflowService.updateWorkflowRun(workflowRunId, { 
        status: 'RUNNING'
      });

      const followUpJobData: SourceQueryJobData = {
        workflowId,
        workflowRunId,
        data: {
          lastProcessedState: { data: nextLastProcessedState }
        }
      };

      const delay = nextLastProcessedState.currentAsyncJob ? 60000 : 300000;
      yield* queueService.add(QUEUE_NAMES.SOURCE_QUERY, `continue-source-query`, followUpJobData, { delay });
      
      yield* Effect.log(`Enqueued follow-up source query for workflow ${workflowId} with ${delay}ms delay`);
    } else {
      yield* workflowService.updateWorkflowRun(workflowRunId, { 
        status: 'COMPLETED', 
        completedAt: new Date() 
      });
      yield* Effect.log(`Source query completed for workflow ${workflowId}, processed ${items.length} items.`);
    }
  }).pipe(
    Effect.catchAll(error =>
      Effect.gen(function* () {
        const { workflowId, workflowRunId } = job.data;
        const workflowService = yield* WorkflowService;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        yield* workflowService.updateWorkflowRun(workflowRunId!, {
          status: 'FAILED',
          completedAt: new Date(),
          failureReason: errorMessage,
        });
        yield* Effect.logError(`Source query for workflow ${workflowId} failed.`, error);
        return yield* Effect.fail(error);
      })
    )
  );

export const createSourceWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;
  yield* queueService.createWorker(QUEUE_NAMES.SOURCE_QUERY, processSourceQueryJob);
});
