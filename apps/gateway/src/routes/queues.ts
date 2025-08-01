import { zValidator } from '@hono/zod-validator';
import { QueueService, QueueStatusService, VALID_QUEUE_NAMES } from '@usersdotfun/shared-queue';
import {
  GetQueueJobsRequestSchema,
  GetQueueJobsResponseSchema,
  GetQueuesStatusResponseSchema,
  RemoveQueueJobRequestSchema,
  RemoveQueueJobResponseSchema,
  RetryQueueJobRequestSchema,
  RetryQueueJobResponseSchema
} from '@usersdotfun/shared-types/schemas';
import { type QueueName } from '@usersdotfun/shared-types/types';
import { Effect } from 'effect';
import { Hono } from 'hono';
import { requireAdmin } from '../middleware/auth';
import { AppRuntime, type AppContext } from '../runtime';
import { honoErrorHandler } from '../utils/error-handlers';

export const queuesRouter = new Hono()
  .get('/status', requireAdmin, async (c) => {
    const program: Effect.Effect<any, Error, AppContext> = Effect.gen(function* () {
      const queueStatusService = yield* QueueStatusService;
      const statuses = yield* Effect.all(
        VALID_QUEUE_NAMES.map((name) => queueStatusService.getQueueStatus(name as QueueName))
      );
      return {
        success: true,
        data: statuses,
      };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(GetQueuesStatusResponseSchema.parse(result));
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })

  .get('/:queueName/jobs', zValidator('query', GetQueueJobsRequestSchema.shape.query), requireAdmin, async (c) => {
    const queueName = c.req.param('queueName') as QueueName;
    const { status } = c.req.valid('query');

    const program: Effect.Effect<any, Error, AppContext> = Effect.gen(function* () {
      const queueStatusService = yield* QueueStatusService;
      let jobsEffect;
      switch (status) {
        case 'failed':
          jobsEffect = queueStatusService.getFailedJobs(queueName as QueueName);
          break;
        case 'active':
          jobsEffect = queueStatusService.getActiveJobs(queueName as QueueName);
          break;
        case 'waiting':
          jobsEffect = queueStatusService.getWaitingJobs(queueName as QueueName);
          break;
        default:
          jobsEffect = Effect.succeed([]);
      }
      const jobs = yield* jobsEffect;
      return {
        success: true,
        data: { items: jobs, total: jobs.length, limit: 50, offset: 0 },
      };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(GetQueueJobsResponseSchema.parse(result));
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })

  .post('/:queueName/jobs/:jobId/retry', zValidator('param', RetryQueueJobRequestSchema.shape.params), requireAdmin, async (c) => {
    const { queueName, jobId } = c.req.valid('param');

    const program: Effect.Effect<string, Error, AppContext> = Effect.gen(function* () {
      const queueService = yield* QueueService;
      yield* queueService.retryJob(queueName as QueueName, jobId);
      return `Job ${jobId} has been queued for retry.`;
    });

    try {
      const message = await AppRuntime.runPromise(program);
      return c.json(RetryQueueJobResponseSchema.parse({
        success: true,
        data: { message },
      }));
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })

  .delete('/:queueName/jobs/:jobId', zValidator('param', RemoveQueueJobRequestSchema.shape.params), requireAdmin, async (c) => {
    const { queueName, jobId } = c.req.valid('param');

    const program: Effect.Effect<string, Error, AppContext> = Effect.gen(function* () {
      const queueService = yield* QueueService;
      const result = yield* queueService.removeJob(queueName as QueueName, jobId);
      
      if (!result.removed) {
        return result.reason || `Failed to remove job ${jobId}`;
      }
      
      return `Job ${jobId} has been removed.`;
    });

    try {
      const message = await AppRuntime.runPromise(program);
      return c.json(RemoveQueueJobResponseSchema.parse({
        success: true,
        data: { message },
      }));
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  });
