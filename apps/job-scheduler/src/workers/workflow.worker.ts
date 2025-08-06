import { WorkflowService } from '@usersdotfun/shared-db';
import { QueueService, StateService } from '@usersdotfun/shared-queue';
import { QUEUE_NAMES, type SourceQueryJobData, type StartWorkflowRunJobData } from '@usersdotfun/shared-types/types';
import { type Job } from 'bullmq';
import { Effect } from 'effect';

const processWorkflowRun = (job: Job<StartWorkflowRunJobData>) =>
  Effect.gen(function* () {
    const { workflowId, workflowRunId, data } = job.data;
    const { triggeredBy } = data;
    const workflowService = yield* WorkflowService;
    const queueService = yield* QueueService;
    const stateService = yield* StateService;

    const run = yield* workflowService.getWorkflowRunById(workflowRunId);

    yield* workflowService.updateWorkflowRun(run.id, { status: 'RUNNING' });

    const richRun = yield* workflowService.getWorkflowRunById(run.id);
    const workflow = yield* workflowService.getWorkflowById(workflowId);
    yield* stateService.publish({
      type: 'WORKFLOW_RUN_STARTED',
      data: richRun,
    });

    yield* Effect.log(`Started Run ${run.id} for Workflow "${workflow.name}"`);

    const processingEffect = Effect.gen(function* () {
      // Enqueue the source query job to handle data fetching and polling
      const sourceJobData: SourceQueryJobData = {
        workflowId,
        workflowRunId: run.id,
        data: {
          lastProcessedState: null,
        }
      };

      yield* queueService.add(QUEUE_NAMES.SOURCE_QUERY, `query-source`, sourceJobData);
      yield* Effect.log(`Enqueued source query job for workflow ${workflowId}`);

      // Update the workflow run status to 'running'. The source worker will handle subsequent status updates.
      yield* workflowService.updateWorkflowRun(run.id, { status: 'RUNNING' });
      yield* Effect.log(`Workflow run ${run.id} is running, source processing delegated to source worker`);
    });

    return yield* processingEffect.pipe(
      Effect.catchAll(error =>
        Effect.gen(function* () {
          const updatedRun = yield* workflowService.updateWorkflowRun(run.id, { status: 'FAILED', completedAt: new Date() });
          yield* stateService.publish({
            type: 'WORKFLOW_RUN_FAILED',
            data: updatedRun,
          });
          yield* Effect.logError(`Run for workflow ${workflowId} failed.`, error);
          return yield* Effect.fail(error); // Allow BullMQ to handle retries
        })
      )
    );
  });

export const createWorkflowWorker = Effect.gen(function* () {
  const queueService = yield* QueueService;
  yield* queueService.createWorker(QUEUE_NAMES.WORKFLOW_RUN, processWorkflowRun);
});
