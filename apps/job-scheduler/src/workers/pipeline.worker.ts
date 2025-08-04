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

    const run = yield* workflowService.getWorkflowRunById(workflowRunId);
    const workflow = yield* workflowService.getWorkflowById(run.workflowId);

    let currentInput: any = input;

    for (const stepDefinition of workflow.pipeline.steps) {
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

      const execute = Effect.acquireUseRelease(
        pluginService.initializePlugin(
          stepDefinition,
          `Run ${workflowRunId}, Item ${sourceItemId}, Step "${stepDefinition.stepId}"`
        ),
        (plugin) => pluginService.executePlugin(
          plugin,
          currentInput,
          `Run ${workflowRunId}, Item ${sourceItemId}, Step "${stepDefinition.stepId}"`
        ),
        () => Effect.void
      );

      const rawOutput = yield* execute;

      const parseResult = GenericPluginOutputSchema.safeParse(rawOutput);
      if (!parseResult.success) {
        const error = new Error(`Plugin output validation failed: ${parseResult.error.message}`);
        yield* workflowService.updatePluginRun(pluginRun.id, {
          status: 'failed',
          error: { message: error.message },
          completedAt: new Date(),
        });
        return yield* Effect.fail(error);
      }

      const output = parseResult.data;

      if (!output.success) {
        const error = new Error(`Plugin ${stepDefinition.pluginId} execution failed: ${JSON.stringify(output.errors)}`);
        yield* workflowService.updatePluginRun(pluginRun.id, {
          status: 'failed',
          error: { message: error.message },
          completedAt: new Date(),
        });
        return yield* Effect.fail(error);
      }

      yield* workflowService.updatePluginRun(pluginRun.id, {
        status: 'completed',
        output,
        completedAt: new Date(),
      });

      currentInput = output.data as Record<string, unknown>;
    }

    yield* Effect.log(`Pipeline completed for Item ${sourceItemId}`);
  }).pipe(
    Effect.catchAll(error =>
      Effect.gen(function* () {
        const { workflowRunId, sourceItemId } = job.data;
        const workflowService = yield* WorkflowService;
        yield* workflowService.updateWorkflowRun(workflowRunId, { status: 'partially_completed' });
        yield* Effect.logError(`Pipeline failed for Item ${sourceItemId}`, error);
        return yield* Effect.fail(error);
      })
    )
  );

export const createPipelineWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;
  yield* queueService.createWorker(QUEUE_NAMES.PIPELINE_EXECUTION, processPipelineJob);
});
