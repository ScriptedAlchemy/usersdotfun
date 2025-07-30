import { zValidator } from '@hono/zod-validator'
import { VALID_QUEUE_NAMES, type QueueName } from '@usersdotfun/shared-queue'
import {
  AllQueueJobsDataSchema,
  ApiSuccessResponseSchema,
  ClearQueueQuerySchema,
  QueueClearResultDataSchema,
  QueueDetailsDataSchema,
  QueueItemsDataSchema,
  QueueItemsQuerySchema,
  QueueJobParamsSchema,
  QueueJobsQuerySchema,
  QueueNameParamSchema,
  QueuesOverviewDataSchema,
  QueuesStatusQuerySchema,
  SimpleMessageDataSchema
} from '@usersdotfun/shared-types/schemas'
import { Hono } from 'hono'
import { requireAdmin, requireAuth } from '../middleware/auth'
import { getQueueAdapter } from '../services/queue-adapter.service'
import { getWebSocketManager } from '../services/websocket-manager.service'
import { honoErrorHandler } from '../utils/error-handlers'

const wsManager = getWebSocketManager()

export const queuesRouter = new Hono()
  // Get overall queue status
  .get('/status',
    zValidator('query', QueuesStatusQuerySchema),
    requireAuth,
    async (c) => {
      try {
        const queueAdapter = await getQueueAdapter()
        const result = await queueAdapter.getQueuesOverview()
        const validatedResult = QueuesOverviewDataSchema.parse(result)
        return c.json(ApiSuccessResponseSchema(QueuesOverviewDataSchema).parse({
          statusCode: 200,
          success: true,
          data: validatedResult,
          timestamp: new Date().toISOString(),
        }))
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  // Get all jobs across queues
  .get('/jobs',
    zValidator('query', QueueJobsQuerySchema),
    requireAuth,
    async (c) => {
      try {
        const validatedQuery = c.req.valid('query')
        const queueAdapter = await getQueueAdapter()
        const result = await queueAdapter.getAllJobs(validatedQuery.status, validatedQuery.limit)
        const validatedResult = AllQueueJobsDataSchema.parse(result)
        return c.json(ApiSuccessResponseSchema(AllQueueJobsDataSchema).parse({
          statusCode: 200,
          success: true,
          data: validatedResult,
          timestamp: new Date().toISOString(),
        }))
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  // Get detailed queue information
  .get('/:queueName',
    zValidator('param', QueueNameParamSchema),
    requireAuth,
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const queueName = validatedParams.queueName as QueueName;

        if (!VALID_QUEUE_NAMES.includes(queueName)) {
          return c.json({ error: 'Invalid queue name' }, 400)
        }

        const queueAdapter = await getQueueAdapter()
        const result = await queueAdapter.getQueueDetails(queueName)
        const validatedResult = QueueDetailsDataSchema.parse(result)
        return c.json(ApiSuccessResponseSchema(QueueDetailsDataSchema).parse({
          statusCode: 200,
          success: true,
          data: validatedResult,
          timestamp: new Date().toISOString(),
        }))
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  // Get queue items with pagination
  .get('/:queueName/items',
    zValidator('param', QueueNameParamSchema),
    zValidator('query', QueueItemsQuerySchema),
    requireAuth,
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const validatedQuery = c.req.valid('query')
        const queueName = validatedParams.queueName as QueueName;

        if (!VALID_QUEUE_NAMES.includes(queueName)) {
          return c.json({ error: 'Invalid queue name' }, 400)
        }

        const queueAdapter = await getQueueAdapter()
        const result = await queueAdapter.getQueueItems(
          queueName,
          validatedQuery.status,
          validatedQuery.page || 1,
          validatedQuery.limit || 50
        )
        const validatedResult = QueueItemsDataSchema.parse(result)
        return c.json(ApiSuccessResponseSchema(QueueItemsDataSchema).parse({
          statusCode: 200,
          success: true,
          data: validatedResult,
          timestamp: new Date().toISOString(),
        }))
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  // Queue management actions (admin only)
  .post('/:queueName/pause',
    zValidator('param', QueueNameParamSchema),
    requireAdmin,
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const queueName = validatedParams.queueName as QueueName;

        if (!VALID_QUEUE_NAMES.includes(queueName)) {
          return c.json({ error: 'Invalid queue name' }, 400)
        }

        const queueAdapter = await getQueueAdapter()
        const result = await queueAdapter.pauseQueue(queueName)

        if (result.success) {
          // Emit WebSocket event for queue pause
          wsManager.broadcast({
            type: 'queue:paused',
            data: {
              queueName,
              timestamp: new Date().toISOString()
            }
          })

          const message = { message: result.message }
          const validatedMessage = SimpleMessageDataSchema.parse(message)
          return c.json(ApiSuccessResponseSchema(SimpleMessageDataSchema).parse({
            statusCode: 200,
            success: true,
            data: validatedMessage,
            timestamp: new Date().toISOString(),
          }))
        } else {
          return c.json({ error: result.message }, 500)
        }
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  .post('/:queueName/resume',
    zValidator('param', QueueNameParamSchema),
    requireAdmin,
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const queueName = validatedParams.queueName as QueueName;

        if (!VALID_QUEUE_NAMES.includes(queueName)) {
          return c.json({ error: 'Invalid queue name' }, 400)
        }

        const queueAdapter = await getQueueAdapter()
        const result = await queueAdapter.resumeQueue(queueName)

        if (result.success) {
          // Emit WebSocket event for queue resume
          wsManager.broadcast({
            type: 'queue:resumed',
            data: {
              queueName,
              timestamp: new Date().toISOString()
            }
          })

          const message = { message: result.message }
          const validatedMessage = SimpleMessageDataSchema.parse(message)
          return c.json(ApiSuccessResponseSchema(SimpleMessageDataSchema).parse({
            statusCode: 200,
            success: true,
            data: validatedMessage,
            timestamp: new Date().toISOString(),
          }))
        } else {
          return c.json({ error: result.message }, 500)
        }
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  .delete('/:queueName/clear',
    zValidator('param', QueueNameParamSchema),
    zValidator('query', ClearQueueQuerySchema),
    requireAdmin,
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const validatedQuery = c.req.valid('query')
        const queueName = validatedParams.queueName as QueueName;

        if (!VALID_QUEUE_NAMES.includes(queueName)) {
          return c.json({ error: 'Invalid queue name' }, 400)
        }

        const queueAdapter = await getQueueAdapter()
        const result = await queueAdapter.clearQueue(queueName, validatedQuery.type)

        if (result.success) {
          // Emit WebSocket event for queue clear
          wsManager.broadcast({
            type: 'queue:cleared',
            data: {
              queueName,
              itemsRemoved: result.itemsRemoved,
              timestamp: new Date().toISOString()
            }
          })

          const clearResult = {
            message: result.message,
            itemsRemoved: result.itemsRemoved || 0
          }
          const validatedResult = QueueClearResultDataSchema.parse(clearResult)
          return c.json(ApiSuccessResponseSchema(QueueClearResultDataSchema).parse({
            statusCode: 200,
            success: true,
            data: validatedResult,
            timestamp: new Date().toISOString(),
          }))
        } else {
          return c.json({ error: result.message }, 500)
        }
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  .delete('/:queueName/purge',
    zValidator('param', QueueNameParamSchema),
    requireAdmin,
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const queueName = validatedParams.queueName as QueueName;

        if (!VALID_QUEUE_NAMES.includes(queueName)) {
          return c.json({ error: 'Invalid queue name' }, 400)
        }

        // Purge removes ALL jobs (equivalent to clear with type 'all')
        const queueAdapter = await getQueueAdapter()
        const result = await queueAdapter.clearQueue(queueName, 'all')

        if (result.success) {
          const purgeResult = {
            message: `Purged all jobs from queue ${queueName}`,
            itemsRemoved: result.itemsRemoved || 0
          }
          const validatedResult = QueueClearResultDataSchema.parse(purgeResult)
          return c.json(ApiSuccessResponseSchema(QueueClearResultDataSchema).parse({
            statusCode: 200,
            success: true,
            data: validatedResult,
            timestamp: new Date().toISOString(),
          }))
        } else {
          return c.json({ error: result.message }, 500)
        }
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  // Individual job actions
  .delete('/:queueName/jobs/:jobId',
    zValidator('param', QueueJobParamsSchema),
    requireAdmin,
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const queueName = validatedParams.queueName as QueueName;

        if (!VALID_QUEUE_NAMES.includes(queueName)) {
          return c.json({ error: 'Invalid queue name' }, 400)
        }

        const queueAdapter = await getQueueAdapter()
        const result = await queueAdapter.removeQueueJob(queueName, validatedParams.jobId)

        if (result.success) {
          // Emit WebSocket event for job removal
          wsManager.broadcast({
            type: 'queue:job-removed',
            data: {
              queueName,
              jobId: validatedParams.jobId,
              timestamp: new Date().toISOString()
            }
          })

          const message = { message: result.message }
          const validatedMessage = SimpleMessageDataSchema.parse(message)
          return c.json(ApiSuccessResponseSchema(SimpleMessageDataSchema).parse({
            statusCode: 200,
            success: true,
            data: validatedMessage,
            timestamp: new Date().toISOString(),
          }))
        } else {
          return c.json({ error: result.message }, 400)
        }
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  .post('/:queueName/jobs/:jobId/retry',
    zValidator('param', QueueJobParamsSchema),
    requireAdmin,
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const queueName = validatedParams.queueName as QueueName;

        if (!VALID_QUEUE_NAMES.includes(queueName)) {
          return c.json({ error: 'Invalid queue name' }, 400)
        }

        const queueAdapter = await getQueueAdapter()
        const result = await queueAdapter.retryQueueJob(queueName, validatedParams.jobId)

        if (result.success) {
          // Emit WebSocket event for job retry
          wsManager.broadcast({
            type: 'queue:job-retried',
            data: {
              queueName,
              jobId: validatedParams.jobId,
              timestamp: new Date().toISOString()
            }
          })

          const message = { message: result.message }
          const validatedMessage = SimpleMessageDataSchema.parse(message)
          return c.json(ApiSuccessResponseSchema(SimpleMessageDataSchema).parse({
            statusCode: 200,
            success: true,
            data: validatedMessage,
            timestamp: new Date().toISOString(),
          }))
        } else {
          return c.json({ error: result.message }, 400)
        }
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })
