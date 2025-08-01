import { zValidator } from '@hono/zod-validator';
import { WorkflowService } from '@usersdotfun/shared-db';
import { QueueService } from '@usersdotfun/shared-queue';
import {
  CreateWorkflowRequestSchema,
  CreateWorkflowResponseSchema,
  DeleteWorkflowRequestSchema,
  DeleteWorkflowResponseSchema,
  GetRunDetailsRequestSchema,
  GetRunDetailsResponseSchema,
  GetWorkflowItemsRequestSchema,
  GetWorkflowItemsResponseSchema,
  GetWorkflowRequestSchema,
  GetWorkflowResponseSchema,
  GetWorkflowRunsRequestSchema,
  GetWorkflowRunsResponseSchema,
  GetWorkflowsResponseSchema,
  RetryFromStepRequestSchema,
  RetryFromStepResponseSchema,
  UpdateWorkflowRequestSchema,
  UpdateWorkflowResponseSchema
} from '@usersdotfun/shared-types/schemas';
import { QUEUE_NAMES } from '@usersdotfun/shared-types/types';
import { Effect } from 'effect';
import { Hono } from 'hono';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { AppRuntime, type AppContext } from '../runtime';
import { honoErrorHandler } from '../utils/error-handlers';

export const workflowsRouter = new Hono()
  .get('/', requireAuth, async (c) => {
    const program: Effect.Effect<any, Error, AppContext> = Effect.gen(function* () {
      const workflowService = yield* WorkflowService;
      const workflows = yield* workflowService.getWorkflows();
      return { success: true, data: workflows };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(GetWorkflowsResponseSchema.parse(result));
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })

  .post('/', zValidator('json', CreateWorkflowRequestSchema.shape.body), requireAdmin, async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');

    const program: Effect.Effect<any, Error, AppContext> = Effect.gen(function* () {
      const workflowService = yield* WorkflowService;
      const newWorkflow = yield* workflowService.createWorkflow({ ...body, createdBy: user!.id });
      return { success: true, data: newWorkflow };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(CreateWorkflowResponseSchema.parse(result), 201);
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })

  .get('/:id', zValidator('param', GetWorkflowRequestSchema.shape.params), requireAuth, async (c) => {
    const { id } = c.req.valid('param');

    const program: Effect.Effect<any, Error, AppContext> = Effect.gen(function* () {
      const workflowService = yield* WorkflowService;
      const workflow = yield* workflowService.getWorkflowById(id);
      return { success: true, data: workflow };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(GetWorkflowResponseSchema.parse(result));
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })

  .put('/:id', zValidator('param', UpdateWorkflowRequestSchema.shape.params), zValidator('json', UpdateWorkflowRequestSchema.shape.body), requireAdmin, async (c) => {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');

    const program: Effect.Effect<any, Error, AppContext> = Effect.gen(function* () {
      const workflowService = yield* WorkflowService;
      const updatedWorkflow = yield* workflowService.updateWorkflow(id, body);
      return { success: true, data: updatedWorkflow };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(UpdateWorkflowResponseSchema.parse(result));
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })

  .delete('/:id', zValidator('param', DeleteWorkflowRequestSchema.shape.params), requireAdmin, async (c) => {
    const { id } = c.req.valid('param');

    const program: Effect.Effect<any, Error, AppContext> = Effect.gen(function* () {
      const workflowService = yield* WorkflowService;
      yield* workflowService.deleteWorkflow(id);
      return { success: true, data: { message: `Workflow ${id} has been deleted.` } };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(DeleteWorkflowResponseSchema.parse(result));
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })

  .get('/:id/runs', zValidator('param', GetWorkflowRunsRequestSchema.shape.params), requireAuth, async (c) => {
    const { id } = c.req.valid('param');

    const program: Effect.Effect<any, Error, AppContext> = Effect.gen(function* () {
      const workflowService = yield* WorkflowService;
      const runs = yield* workflowService.getRunsForWorkflow(id);
      return { success: true, data: runs };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(GetWorkflowRunsResponseSchema.parse(result));
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })

  .get('/:id/items', zValidator('param', GetWorkflowItemsRequestSchema.shape.params), requireAuth, async (c) => {
    const { id } = c.req.valid('param');

    const program: Effect.Effect<any, Error, AppContext> = Effect.gen(function* () {
      const workflowService = yield* WorkflowService;
      const items = yield* workflowService.getItemsForWorkflow(id);
      return { success: true, data: items };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(GetWorkflowItemsResponseSchema.parse(result));
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })

  .get('/runs/:runId/details', zValidator('param', GetRunDetailsRequestSchema.shape.params), requireAuth, async (c) => {
    const { runId } = c.req.valid('param');

    const program: Effect.Effect<any, Error, AppContext> = Effect.gen(function* () {
      const workflowService = yield* WorkflowService;
      const [run, pluginRuns] = yield* Effect.all([
        workflowService.getRunById(runId),
        workflowService.getPluginRunsForRun(runId),
      ]);
      return {
        success: true,
        data: { run, pluginRuns },
      };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(GetRunDetailsResponseSchema.parse(result));
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })

  .post('/runs/:runId/items/:itemId/retry', zValidator('param', RetryFromStepRequestSchema.shape.params), zValidator('json', RetryFromStepRequestSchema.shape.body), requireAdmin, async (c) => {
    const { runId, itemId } = c.req.valid('param');
    const { fromStepId } = c.req.valid('json');

    const program: Effect.Effect<string, Error, AppContext> = Effect.gen(function* () {
      const workflowService = yield* WorkflowService;
      const queueService = yield* QueueService;

      const failedRun = yield* workflowService.getPluginRunByStep(runId, itemId, fromStepId);
      yield* queueService.add(QUEUE_NAMES.PIPELINE_EXECUTION, 'retry-pipeline-step', {
        workflowRunId: runId,
        sourceItemId: itemId,
        input: failedRun.input as Record<string, unknown>,
        startAtStepId: fromStepId,
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
  });
