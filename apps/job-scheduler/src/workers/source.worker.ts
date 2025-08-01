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
    const { workflowId, workflowRunId, lastProcessedState } = job.data;
    const workflowService = yield* WorkflowService;
    const queueService = yield* QueueService;
    const pluginService = yield* PluginService;

    yield* Effect.log(`Processing source query job for workflow: ${workflowId}, run: ${workflowRunId}`);

    // 1. Get workflow from database
    const workflow = yield* workflowService.getWorkflowById(workflowId);

    try {
      // 2. Initialize the source plugin
      const sourcePlugin = yield* pluginService.initializePlugin<SourcePlugin>(
        workflow.source,
        `Source Query for Workflow "${workflow.name}" [${workflowRunId}]`
      );

      // 3. Execute the source plugin with lastProcessedState
      const rawOutput = yield* pluginService.executePlugin(
        sourcePlugin,
        { 
          searchOptions: workflow.source.search,
          lastProcessedState: lastProcessedState ?? null
        },
        `Source Query for Workflow "${workflow.name}" [${workflowRunId}]`
      );

      // 4. Parse the output using our specific schema for type safety
      const parseResult = GenericPluginSourceOutputSchema.safeParse(rawOutput);
      if (!parseResult.success) {
        return yield* Effect.fail(new Error(`Source plugin output validation failed: ${parseResult.error.message}`));
      }

      const output = parseResult.data;
      if (!output.success || !output.data) {
        return yield* Effect.fail(new Error("Source plugin failed to return data"));
      }

      const { items, nextLastProcessedState } = output.data;

      // 5. Update the workflow run with the total items count
      yield* workflowService.updateWorkflowRun(workflowRunId, { status: "completed", itemsTotal: items.length });

      // 6. Persist source items and enqueue them for the pipeline
      if (items.length > 0) {
        yield* Effect.log(`Enqueuing ${items.length} items for pipeline processing`);

        yield* Effect.forEach(items, (item, index) =>
          Effect.gen(function* () {
            const sourceItem = yield* workflowService.upsertSourceItem({
              workflowId,
              data: item.raw,
              processedAt: null,
            });

            const pipelineJobData: ExecutePipelineJobData = {
              workflowRunId,
              sourceItemId: sourceItem.id,
              input: item.raw as Record<string, unknown>,
            };

            yield* queueService.add(QUEUE_NAMES.PIPELINE_EXECUTION, `process-item`, pipelineJobData);
          }), { concurrency: 10, discard: true }
        );
      }

      // 7. Handle polling state - if there's more data to fetch, enqueue another source query
      if (nextLastProcessedState) {
        yield* Effect.log(`More data available. Enqueueing follow-up source query for workflow ${workflowId}`);
        
        // Update the workflow run to indicate it's part of a polling sequence
        yield* workflowService.updateWorkflowRun(workflowRunId, { 
          status: 'polling'
        });

        // Enqueue a follow-up source query job with the next state
        const followUpJobData: SourceQueryJobData = {
          workflowId,
          workflowRunId,
          lastProcessedState: { data: nextLastProcessedState }
        };

        const delay = nextLastProcessedState.currentAsyncJob ? 60000 : 300000; // 1 min if active job, 5 min otherwise
        yield* queueService.add(QUEUE_NAMES.SOURCE_QUERY, `continue-source-query`, followUpJobData, { delay });
        
        yield* Effect.log(`Enqueued follow-up source query for workflow ${workflowId} with ${delay}ms delay`);
      } else {
        // 8. Finalize the workflow run - no more data to fetch
        yield* workflowService.updateWorkflowRun(workflowRunId, { 
          status: 'completed', 
          completedAt: new Date() 
        });
        yield* Effect.log(`Source query completed for workflow ${workflowId}, processed ${items.length} items.`);
      }

    } catch (error) {
      // 9. Handle any failure during the process
      yield* workflowService.updateWorkflowRun(workflowRunId, { 
        status: 'failed', 
        completedAt: new Date() 
      });
      yield* Effect.logError(`Source query for workflow ${workflowId} failed.`, error);
      return yield* Effect.fail(error); // Allow BullMQ to handle retries
    }
  });

export const createSourceWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;
  yield* queueService.createWorker(QUEUE_NAMES.SOURCE_QUERY, processSourceQueryJob);
});
