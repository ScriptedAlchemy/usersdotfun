import { executePipeline } from '@usersdotfun/pipeline-runner';
import { WorkflowService } from '@usersdotfun/shared-db';
import { QueueService, StateService, RedisKeys, QUEUE_NAMES } from '@usersdotfun/shared-queue';
import { type Job } from 'bullmq';
import { Effect } from 'effect';
import type { PipelineJobData } from '@usersdotfun/shared-types/types';

const processPipelineJob = (job: Job<PipelineJobData>) =>
  Effect.gen(function* () {
    const { workflow, item, runId, itemIndex, sourceJobId: workflowId } = job.data;
    const stateService = yield* StateService;
    const workflowService = yield* WorkflowService;
    const startedAt = new Date();

    yield* Effect.log(`Processing pipeline for item ${itemIndex} (run: ${runId}): ${JSON.stringify(item)}`);

    // Store pipeline item state
    yield* stateService.set(RedisKeys.pipelineItem(runId, itemIndex), {
      id: `${runId}:${itemIndex}`,
      runId,
      stepId: `pipeline-${itemIndex}`,
      pluginName: 'pipeline-processor',
      config: null,
      input: item,
      output: null,
      error: null,
      status: 'processing',
      startedAt: startedAt.toISOString(),
      completedAt: null,
    });

    try {
      const result = yield* executePipeline(
        workflow.pipeline,
        item,
        {
          runId,
          itemIndex,
          env: workflow.pipeline.env || { secrets: [] },
        }
      );

      yield* Effect.log(`Pipeline completed for item ${itemIndex} (run: ${runId}) with result: ${JSON.stringify(result)}`);

      yield* workflowService.createPluginRun({
        runId,
        stepId: `pipeline-${itemIndex}`,
        pluginName: 'pipeline-processor',
        input: item,
        output: result,
        status: 'completed',
        startedAt,
        completedAt: new Date(),
      });

      // Update pipeline item state with success
      yield* stateService.set(RedisKeys.pipelineItem(runId, itemIndex), {
        id: `${runId}:${itemIndex}`,
        runId,
        stepId: `pipeline-${itemIndex}`,
        pluginName: 'pipeline-processor',
        config: null,
        input: item,
        output: result,
        error: null,
        status: 'completed',
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      yield* Effect.logError(`Pipeline failed for item ${itemIndex} (run: ${runId})`, error);

      yield* workflowService.createPluginRun({
        runId,
        stepId: `pipeline-${itemIndex}`,
        pluginName: 'pipeline-processor',
        input: item,
        output: null,
        error: errorMessage,
        status: 'failed',
        startedAt,
        completedAt: new Date(),
      });

      // Update pipeline item state with failure
      yield* stateService.set(RedisKeys.pipelineItem(runId, itemIndex), {
        id: `${runId}:${itemIndex}`,
        runId,
        stepId: `pipeline-${itemIndex}`,
        pluginName: 'pipeline-processor',
        config: null,
        input: item,
        output: null,
        error: errorMessage,
        status: 'failed',
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
      });

      yield* workflowService.updateWorkflow(workflowId, { status: 'failed' });
      return yield* Effect.fail(error);
    }
  });

export const createPipelineWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;

  yield* queueService.createWorker(QUEUE_NAMES.PIPELINE_JOBS, (job: Job<PipelineJobData>) =>
    processPipelineJob(job)
  );
});
