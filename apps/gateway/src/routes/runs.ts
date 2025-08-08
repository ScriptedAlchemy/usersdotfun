import { zValidator } from '@hono/zod-validator';
import { WorkflowService } from '@usersdotfun/shared-db';
import { QueueService, StateService } from '@usersdotfun/shared-queue';
import {
  DeleteWorkflowRunRequestSchema,
  GetWorkflowRunRequestSchema,
  GetWorkflowRunResponseSchema,
  RetryFromStepRequestSchema,
  RetryFromStepResponseSchema,
  CancelWorkflowRunRequestSchema
} from '@usersdotfun/shared-types/schemas';
import { QUEUE_NAMES } from '@usersdotfun/shared-types/types';
import { Effect } from 'effect';
import { Hono } from 'hono';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { AppRuntime } from '../runtime';
import type { AppType } from '../types/hono';
import { honoErrorHandler } from '../utils/error-handlers';

export const runsRouter = new Hono<AppType>()
  .get('/:runId/details', zValidator('param', GetWorkflowRunRequestSchema.shape.params), requireAuth, async (c) => {
    const { runId } = c.req.valid('param');

    const program = Effect.gen(function* () {
      const workflowService = yield* WorkflowService;
      const run = yield* workflowService.getWorkflowRunById(runId);
      return {
        success: true,
        data: run,
      };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(GetWorkflowRunResponseSchema.parse(result));
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })

  .post('/:runId/items/:itemId/retry', zValidator('param', RetryFromStepRequestSchema.shape.params), zValidator('json', RetryFromStepRequestSchema.shape.body), requireAdmin, async (c) => {
    const { runId, itemId } = c.req.valid('param');
    const { fromStepId } = c.req.valid('json');

    const program = Effect.gen(function* () {
      const workflowService = yield* WorkflowService;
      const queueService = yield* QueueService;

      const failedRun = yield* workflowService.getPluginRunByStep(runId, itemId, fromStepId);
      const run = yield* workflowService.getWorkflowRunById(runId);
      yield* queueService.add(QUEUE_NAMES.PIPELINE_EXECUTION, 'retry-pipeline-step', {
        workflowId: run.workflowId,
        workflowRunId: runId,
        data: {
          sourceItemId: itemId,
          input: failedRun.input as Record<string, unknown>,
          startAtStepId: fromStepId,
        }
      });

      return `Retrying item ${itemId} from step ${fromStepId}.`;
    });

    try {
      const message = await AppRuntime.runPromise(program);
      return c.json(RetryFromStepResponseSchema.parse({
        success: true,
        data: { message },
      }));
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })
  .post('/:runId/cancel', zValidator('param', CancelWorkflowRunRequestSchema.shape.params), requireAdmin, async (c) => {
    const { runId } = c.req.valid('param');

    const program = Effect.gen(function* () {
      const workflowService = yield* WorkflowService;
      const stateService = yield* StateService;
      const run = yield* workflowService.getWorkflowRunById(runId);
      yield* workflowService.updateWorkflowRun(runId, { status: 'CANCELLED' });
      yield* stateService.publish({
        type: 'WORKFLOW_RUN_CANCELLED',
        data: run,
      });
      return { success: true, data: { message: `Workflow run ${runId} has been stopped.` } };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(result);
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })
  .delete('/:runId', zValidator('param', DeleteWorkflowRunRequestSchema.shape.params), requireAdmin, async (c) => {
    const { runId } = c.req.valid('param');

    const program = Effect.gen(function* () {
      const workflowService = yield* WorkflowService;
      const stateService = yield* StateService;
      const run = yield* workflowService.getWorkflowRunById(runId);
      yield* workflowService.deleteWorkflowRun(runId);
      yield* stateService.publish({
        type: 'WORKFLOW_RUN_DELETED',
        data: run,
      });
      return { success: true, data: { message: `Workflow run ${runId} has been deleted.` } };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(result);
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })

  .get('/:runId/items', 
    zValidator('param', z.object({ runId: z.string() })), 
    requireAuth, 
    async (c) => {
      const { runId } = c.req.valid('param');

      const program = Effect.gen(function* () {
        const workflowService = yield* WorkflowService;
        const items = yield* workflowService.getItemsForWorkflowRun(runId);
        return { success: true, data: items };
      });

      try {
        const result = await AppRuntime.runPromise(program);
        return c.json(result);
      } catch (err) {
        return honoErrorHandler(c, err);
      }
    })

  .get('/:runId/plugin-runs', 
    zValidator('param', z.object({ runId: z.string() })),
    zValidator('query', z.object({
      type: z.enum(['SOURCE', 'PIPELINE']).optional()
    })),
    requireAuth, 
    async (c) => {
      const { runId } = c.req.valid('param');
      const { type } = c.req.valid('query');

      const program = Effect.gen(function* () {
        const workflowService = yield* WorkflowService;
        const pluginRuns = yield* workflowService.getPluginRunsForWorkflowRun(runId, type);
        return { success: true, data: { 
          type: type || 'ALL',
          pluginRuns 
        } };
      });

      try {
        const result = await AppRuntime.runPromise(program);
        return c.json(result);
      } catch (err) {
        return honoErrorHandler(c, err);
      }
    });
