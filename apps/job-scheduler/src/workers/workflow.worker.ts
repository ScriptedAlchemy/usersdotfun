import { PluginService } from '@usersdotfun/pipeline-runner';
import { WorkflowService } from '@usersdotfun/shared-db';
import { QueueService } from '@usersdotfun/shared-queue';
import { QUEUE_NAMES, type StartWorkflowRunJobData, type SourceQueryJobData } from '@usersdotfun/shared-types/types';
import { type Job } from 'bullmq';
import { Effect } from 'effect';

const processWorkflowRun = (job: Job<StartWorkflowRunJobData>) =>
  Effect.gen(function* () {
    const { workflowId, triggeredBy } = job.data;
    const workflowService = yield* WorkflowService;
    const queueService = yield* QueueService;

    // 1. Create the durable run record and publish the "started" event
    const workflow = yield* workflowService.getWorkflowById(workflowId);
    const run = yield* workflowService.createWorkflowRun({
      workflowId,
      status: 'running',
      triggeredBy: triggeredBy ?? null,
    });
    // PUBLISH `workflow:run-started` event here via Redis Pub/Sub

    yield* Effect.log(`Started Run ${run.id} for Workflow "${workflow.name}"`);

    try {
      // 2. Enqueue the source query job to handle data fetching and polling
      const sourceJobData: SourceQueryJobData = {
        workflowId,
        workflowRunId: run.id,
        lastProcessedState: null,
      };

      yield* queueService.add(QUEUE_NAMES.SOURCE_QUERY, `query-source`, sourceJobData);
      yield* Effect.log(`Enqueued source query job for workflow ${workflowId}`);

      // 3. Mark the workflow run as completed (the source worker will handle the actual processing)
      const finalRun = yield* workflowService.updateWorkflowRun(run.id, { status: 'completed', completedAt: new Date() });
      // PUBLISH `workflow:run-completed` event here
      yield* Effect.log(`Workflow run ${run.id} completed - source processing delegated to source worker`);

    } catch (error) {
      // 4. Handle any failure during the process
      const finalRun = yield* workflowService.updateWorkflowRun(run.id, { status: 'failed', completedAt: new Date() });
      // PUBLISH `workflow:run-completed` event here (with failed status)
      yield* Effect.logError(`Run ${run.id} failed.`, error);
      return yield* Effect.fail(error); // Allow BullMQ to handle retries
    }
  });

export const createWorkflowWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;
  yield* queueService.createWorker(QUEUE_NAMES.WORKFLOW_RUN, processWorkflowRun);
});
