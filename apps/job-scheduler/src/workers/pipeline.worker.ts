import { createOutputSchema } from '@usersdotfun/core-sdk';
import { PluginService } from '@usersdotfun/pipeline-runner';
import { WorkflowService } from '@usersdotfun/shared-db';
import { QueueService } from '@usersdotfun/shared-queue';
import { type ExecutePipelineJobData, QUEUE_NAMES, type Pipeline } from '@usersdotfun/shared-types/types';
import { type Job } from 'bullmq';
import { Effect } from 'effect';
import { z } from 'zod';

// Create a generic output schema for parsing plugin outputs
const GenericPluginOutputSchema = createOutputSchema(z.unknown());

const processPipelineJob = (job: Job<ExecutePipelineJobData>) =>
  Effect.gen(function* () {
    const { workflowRunId, sourceItemId, input } = job.data;
    const workflowService = yield* WorkflowService;
    const pluginService = yield* PluginService;

    const run = yield* workflowService.getRunById(workflowRunId);
    const workflow = yield* workflowService.getWorkflowById(run.workflowId);

    let currentInput: any = input;

    // Sequentially execute each step in the pipeline
    for (const stepDefinition of workflow.pipeline.steps) {
      // 1. Create the historical record for this specific plugin run
      const pluginRun = yield* workflowService.createPluginRun({
        workflowRunId,
        sourceItemId,
        stepId: stepDefinition.stepId,
        pluginId: stepDefinition.pluginId,
        config: stepDefinition.config,
        status: 'processing',
        input: currentInput,
        startedAt: new Date(),
      });

      try {
        // 2. Initialize the plugin for this step
        const plugin = yield* pluginService.initializePlugin(
          stepDefinition,
          `Run ${workflowRunId}, Item ${sourceItemId}, Step "${stepDefinition.stepId}"`
        );

        // 3. Execute the plugin
        const rawOutput = yield* pluginService.executePlugin(
          plugin,
          currentInput,
          `Run ${workflowRunId}, Item ${sourceItemId}, Step "${stepDefinition.stepId}"`
        );

        // 4. Parse the output using our generic schema for type safety
        const parseResult = GenericPluginOutputSchema.safeParse(rawOutput);
        if (!parseResult.success) {
          const error = new Error(`Plugin output validation failed: ${parseResult.error.message}`);
          const finalRun = yield* workflowService.updatePluginRun(pluginRun.id, {
            status: 'failed',
            error: { message: error.message },
            completedAt: new Date(),
          });
          // PUBLISH `plugin:run-failed` event here with `finalRun` data
          return yield* Effect.fail(error);
        }

        const output = parseResult.data;

        // 5. Validate that the plugin execution was successful
        if (!output.success) {
          const error = new Error(`Plugin ${stepDefinition.pluginId} execution failed: ${JSON.stringify(output.errors)}`);
          const finalRun = yield* workflowService.updatePluginRun(pluginRun.id, {
            status: 'failed',
            error: { message: error.message },
            completedAt: new Date(),
          });
          // PUBLISH `plugin:run-failed` event here with `finalRun` data
          return yield* Effect.fail(error);
        }

        // 6. On success, update the record and publish the event
        const finalRun = yield* workflowService.updatePluginRun(pluginRun.id, {
          status: 'completed',
          output,
          completedAt: new Date(),
        });
        // PUBLISH `plugin:run-completed` event here with `finalRun` data

        // 7. Pass the data field (not the entire output object) to the next step
        currentInput = output.data as Record<string, unknown>;
      } catch (error) {
        // 5. On failure, update the record, publish the event, and stop processing this item
        const finalRun = yield* workflowService.updatePluginRun(pluginRun.id, {
          status: 'failed',
          error: { message: error instanceof Error ? error.message : String(error) },
          completedAt: new Date(),
        });
        // PUBLISH `plugin:run-failed` event here with `finalRun` data

        // Update the main workflow run to indicate partial failure
        yield* workflowService.updateWorkflowRun(workflowRunId, { status: 'partially_completed' });

        yield* Effect.logError(`Pipeline failed for Item ${sourceItemId} at Step "${stepDefinition.stepId}"`, error);
        return yield* Effect.fail(error); // Stop this job, but don't necessarily retry the whole pipeline
      }
    }

    yield* Effect.log(`Pipeline completed for Item ${sourceItemId}`);
  });

export const createPipelineWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;
  yield* queueService.createWorker(QUEUE_NAMES.PIPELINE_EXECUTION, processPipelineJob);
});
