import { zValidator } from '@hono/zod-validator';
import { QueueService } from '@usersdotfun/shared-queue';
import { ClearQueueRequestSchema, DeleteJobRequestSchema, PauseQueueRequestSchema, ResumeQueueRequestSchema } from '@usersdotfun/shared-types/schemas/api/queues';
import { type QueueName } from '@usersdotfun/shared-types/types';
import { Effect } from 'effect';
import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { AppRuntime } from '../runtime';
import { honoErrorHandler } from '../utils/error-handlers';

import { QueueStatusService } from '@usersdotfun/shared-queue';

export const queuesRouter = new Hono()
  .get('/', requireAuth, async (c) => {
    const program = Effect.gen(function* () {
      const queueStatusService = yield* QueueStatusService;
      const statuses = yield* queueStatusService.getQueuesStatus();
      return { success: true, data: statuses };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(result);
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })
  .get('/jobs', requireAuth, async (c) => {
    const program = Effect.gen(function* () {
      const queueStatusService = yield* QueueStatusService;
      const jobs = yield* queueStatusService.getAllJobs();
      return { success: true, data: jobs };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(result);
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })
  .get('/:queueName/jobs', requireAuth, async (c) => {
    const { queueName } = c.req.param();
    const program = Effect.gen(function* () {
      const queueStatusService = yield* QueueStatusService;
      const jobs = yield* queueStatusService.getAllJobs({ queueName: queueName as QueueName });
      return { success: true, data: jobs };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(result);
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })
  .delete('/:queueName/jobs/:jobId', zValidator('param', DeleteJobRequestSchema.shape.params), requireAuth, async (c) => {
    const { queueName, jobId } = c.req.valid('param');
    const program = Effect.gen(function* () {
      const queueService = yield* QueueService;
      yield* queueService.removeJob(queueName as QueueName, jobId);
      return { success: true, data: { message: `Job ${jobId} has been deleted.` } };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(result);
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })
  .post('/:queueName/resume', zValidator('param', ResumeQueueRequestSchema.shape.params), requireAuth, async (c) => {
    const { queueName } = c.req.valid('param');
    const program = Effect.gen(function* () {
      const queueService = yield* QueueService;
      yield* queueService.resumeQueue(queueName as QueueName);
      return { success: true, data: { message: `Queue ${queueName} has been resumed.` } };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(result);
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })
  .post('/:queueName/pause', zValidator('param', PauseQueueRequestSchema.shape.params), requireAuth, async (c) => {
    const { queueName } = c.req.valid('param');
    const program = Effect.gen(function* () {
      const queueService = yield* QueueService;
      yield* queueService.pauseQueue(queueName as QueueName);
      return { success: true, data: { message: `Queue ${queueName} has been paused.` } };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(result);
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  })
  .post('/:queueName/clear', zValidator('param', ClearQueueRequestSchema.shape.params), zValidator('json', ClearQueueRequestSchema.shape.body), requireAuth, async (c) => {
    const { queueName } = c.req.valid('param');
    const { jobType } = c.req.valid('json');
    const program = Effect.gen(function* () {
      const queueService = yield* QueueService;
      const result = yield* queueService.clearQueue(queueName as QueueName, jobType);
      return { success: true, data: result };
    });

    try {
      const result = await AppRuntime.runPromise(program);
      return c.json(result);
    } catch (err) {
      return honoErrorHandler(c, err);
    }
  });
