import { createOutputSchema } from '@usersdotfun/core-sdk';
import { PluginServiceTag } from '@usersdotfun/pipeline-runner';
import { WorkflowService } from '@usersdotfun/shared-db';
import { QueueService, StateService } from '@usersdotfun/shared-queue';
import { QUEUE_NAMES, type ExecutePipelineJobData } from '@usersdotfun/shared-types/types';
import { type Job } from 'bullmq';
import { Effect } from 'effect';
import { z } from 'zod';

// Create a generic output schema for parsing plugin outputs
const GenericPluginOutputSchema = createOutputSchema(z.unknown());

const processPipelineJob = (job: Job<ExecutePipelineJobData>) =>
  Effect.gen(function* () {
    const { workflowId, workflowRunId, data } = job.data;
    if (!workflowRunId) {
      return yield* Effect.fail(new Error("workflowRunId is required for pipeline jobs"));
    }
    const { sourceItemId, input } = data;
    const workflowService = yield* WorkflowService;
    const pluginService = yield* PluginServiceTag;
    const stateService = yield* StateService;

    const run = yield* workflowService.getWorkflowRunById(workflowRunId);
    const workflow = yield* workflowService.getWorkflowById(workflowId);

    let currentInput: any = input;

    for (const stepDefinition of workflow.pipeline.steps) {
      const pluginRun = yield* workflowService.createPluginRun({
        workflowRunId,
        sourceItemId,
        stepId: stepDefinition.stepId,
        pluginId: stepDefinition.pluginId,
        config: stepDefinition.config,
        status: 'RUNNING',
        input: currentInput,
        startedAt: new Date(),
      });

      yield* stateService.publish({
        type: 'PLUGIN_RUN_STARTED',
        data: pluginRun,
      });

      const pluginEffect = Effect.gen(function* () {
        const execute = Effect.acquireUseRelease(
          pluginService.initializePlugin(
            stepDefinition,
            `Run ${workflowRunId}, Item ${sourceItemId}, Step "${stepDefinition.stepId}"`
          ),
          (plugin) =>
            pluginService.executePlugin(
              plugin,
              currentInput,
              `Run ${workflowRunId}, Item ${sourceItemId}, Step "${stepDefinition.stepId}"`
            ),
          () => Effect.void
        );

        const rawOutput = yield* execute;

        const parseResult = GenericPluginOutputSchema.safeParse(rawOutput);
        if (!parseResult.success) {
          const error = new Error(
            `Plugin output validation failed: ${parseResult.error.message}`
          );
          const updatedRun = yield* workflowService.updatePluginRun(pluginRun.id, {
            status: 'FAILED',
            error: { message: error.message },
            completedAt: new Date(),
          });
          yield* stateService.publish({
            type: 'PLUGIN_RUN_FAILED',
            data: updatedRun,
          });
          return yield* Effect.fail(error);
        }

        const output = parseResult.data;

        if (!output.success) {
          const error = new Error(
            `Plugin ${stepDefinition.pluginId
            } execution failed: ${JSON.stringify(output.errors)}`
          );
          const updatedRun = yield* workflowService.updatePluginRun(pluginRun.id, {
            status: 'FAILED',
            error: { message: error.message },
            completedAt: new Date(),
          });
          yield* stateService.publish({
            type: 'PLUGIN_RUN_FAILED',
            data: updatedRun,
          });
          return yield* Effect.fail(error);
        }

        const updatedRun = yield* workflowService.updatePluginRun(pluginRun.id, {
          status: 'COMPLETED',
          output,
          completedAt: new Date(),
        });

        yield* stateService.publish({
          type: 'PLUGIN_RUN_COMPLETED',
          data: updatedRun,
        });

        return output.data;
      }).pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            const updatedRun = yield* workflowService.updatePluginRun(pluginRun.id, {
              status: 'FAILED',
              error: {
                message: 'Failed to execute pipeline step',
                cause: error,
              },
              completedAt: new Date(),
            });
            yield* stateService.publish({
              type: 'PLUGIN_RUN_FAILED',
              data: updatedRun,
            });
            return yield* Effect.fail(error);
          })
        )
      );

      currentInput = yield* pluginEffect;
    }

    yield* Effect.log(`Pipeline completed for Item ${sourceItemId}`);
  }).pipe(
    Effect.catchAll(error =>
      Effect.gen(function* () {
        const { workflowRunId, data } = job.data;
        const { sourceItemId } = data;
        const workflowService = yield* WorkflowService;
        yield* workflowService.updateWorkflowRun(workflowRunId!, { status: 'PARTIAL_SUCCESS' });
        yield* Effect.logError(`Pipeline failed for Item ${sourceItemId}`, error);
        return yield* Effect.fail(error);
      })
    )
  );

export const createPipelineWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;
  yield* queueService.createWorker(QUEUE_NAMES.PIPELINE_EXECUTION, processPipelineJob);
});
