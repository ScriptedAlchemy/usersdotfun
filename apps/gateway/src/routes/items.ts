import { zValidator } from '@hono/zod-validator';
import { WorkflowService } from '@usersdotfun/shared-db';
import { QueueService } from '@usersdotfun/shared-queue';
import { QUEUE_NAMES } from '@usersdotfun/shared-types/types';
import { Effect } from 'effect';
import { Hono } from 'hono';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { AppRuntime } from '../runtime';
import type { AppType } from '../types/hono';
import { honoErrorHandler } from '../utils/error-handlers';

export const itemsRouter = new Hono<AppType>()
  // Get all plugin runs for an item across all workflows
  .get('/:itemId/plugin-runs', 
    zValidator('param', z.object({ itemId: z.string() })),
    requireAuth, 
    async (c) => {
      const { itemId } = c.req.valid('param');

      const program = Effect.gen(function* () {
        const workflowService = yield* WorkflowService;
        const pluginRuns = yield* workflowService.getPluginRunsForItem(itemId);
        return { success: true, data: pluginRuns };
      });

      try {
        const result = await AppRuntime.runPromise(program);
        return c.json(result);
      } catch (err) {
        return honoErrorHandler(c, err);
      }
    })

  // Get all workflow runs an item has been part of
  .get('/:itemId/workflow-runs', 
    zValidator('param', z.object({ itemId: z.string() })),
    requireAuth, 
    async (c) => {
      const { itemId } = c.req.valid('param');

      const program = Effect.gen(function* () {
        const workflowService = yield* WorkflowService;
        const workflowRuns = yield* workflowService.getWorkflowRunsForItem(itemId);
        return { success: true, data: workflowRuns };
      });

      try {
        const result = await AppRuntime.runPromise(program);
        return c.json(result);
      } catch (err) {
        return honoErrorHandler(c, err);
      }
    })
    
  // Retry a specific plugin run
  .post('/:itemId/plugin-runs/:pluginRunId/retry',
    zValidator('param', z.object({ 
      itemId: z.string(), 
      pluginRunId: z.string() 
    })),
    requireAdmin,
    async (c) => {
      const { itemId, pluginRunId } = c.req.valid('param');

      const program = Effect.gen(function* () {
        const workflowService = yield* WorkflowService;
        const queueService = yield* QueueService;
        
        // Get the plugin run details to understand what to retry
        const pluginRun = yield* workflowService.updatePluginRun(pluginRunId, {
          status: 'PENDING',
          error: null,
          output: null,
          completedAt: null,
        });
        
        // Get the workflow run to get the workflow ID
        const workflowRun = yield* workflowService.getWorkflowRunById(pluginRun.workflowRunId);
        
        // Re-enqueue to the PIPELINE_EXECUTION queue
        yield* queueService.add(QUEUE_NAMES.PIPELINE_EXECUTION, `retry-from-step-${pluginRun.stepId}`, {
          workflowId: workflowRun.workflowId,
          workflowRunId: pluginRun.workflowRunId,
          data: {
            sourceItemId: itemId,
            input: pluginRun.input as Record<string, unknown>,
            startAtStepId: pluginRun.stepId, // Start from this specific step
          }
        });

        return { 
          success: true, 
          data: { 
            message: `Plugin run ${pluginRunId} queued for retry from step ${pluginRun.stepId}` 
          } 
        };
      });

      try {
        const result = await AppRuntime.runPromise(program);
        return c.json(result);
      } catch (err) {
        return honoErrorHandler(c, err);
      }
    });
