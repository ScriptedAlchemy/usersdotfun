import { Hono } from 'hono'
import { VALID_QUEUE_NAMES, type QueueName } from '@usersdotfun/shared-queue'
import { requireAdmin, requireAuth } from '../middleware/auth'
import { getQueueAdapter } from '../services/queue-adapter.service'
import { getWebSocketManager } from '../services/websocket-manager.service'
import { honoErrorHandler } from '../utils/error-handlers'

const wsManager = getWebSocketManager()

export const queuesRouter = new Hono()
  // Get overall queue status
  .get('/status', requireAuth, async (c) => {
    try {
      const queueAdapter = await getQueueAdapter()
      const result = await queueAdapter.getQueuesOverview()
      return c.json(result)
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  // Get all jobs across queues
  .get('/jobs', requireAuth, async (c) => {
    try {
      const status = c.req.query('status')
      const limit = parseInt(c.req.query('limit') || '100')

      const queueAdapter = await getQueueAdapter()
      const result = await queueAdapter.getAllJobs(status, limit)
      return c.json(result)
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  // Get detailed queue information
  .get('/:queueName', requireAuth, async (c) => {
    try {
      const queueName = c.req.param('queueName')

      if (!VALID_QUEUE_NAMES.includes(queueName as QueueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      const queueAdapter = await getQueueAdapter()
      const result = await queueAdapter.getQueueDetails(queueName as any)
      return c.json(result)
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  // Get queue items with pagination
  .get('/:queueName/items', requireAuth, async (c) => {
    try {
      const queueName = c.req.param('queueName')
      const status = c.req.query('status') || 'waiting' // waiting, active, completed, failed
      const page = parseInt(c.req.query('page') || '1')
      const limit = parseInt(c.req.query('limit') || '50')

      if (!VALID_QUEUE_NAMES.includes(queueName as QueueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      const queueAdapter = await getQueueAdapter()
      const result = await queueAdapter.getQueueItems(queueName as QueueName, status, page, limit)
      return c.json(result)
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  // Queue management actions (admin only)
  .post('/:queueName/pause', requireAdmin, async (c) => {
    try {
      const queueName = c.req.param('queueName')

      if (!VALID_QUEUE_NAMES.includes(queueName as QueueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      const queueAdapter = await getQueueAdapter()
      const result = await queueAdapter.pauseQueue(queueName as QueueName)

      if (result.success) {
        // Emit WebSocket event for queue pause
        wsManager.broadcast({
          type: 'queue:paused',
          data: {
            queueName,
            timestamp: new Date().toISOString()
          }
        })

        return c.json({ message: result.message })
      } else {
        return c.json({ error: result.message }, 500)
      }
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  .post('/:queueName/resume', requireAdmin, async (c) => {
    try {
      const queueName = c.req.param('queueName')

      if (!VALID_QUEUE_NAMES.includes(queueName as QueueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      const queueAdapter = await getQueueAdapter()
      const result = await queueAdapter.resumeQueue(queueName as QueueName)

      if (result.success) {
        // Emit WebSocket event for queue resume
        wsManager.broadcast({
          type: 'queue:resumed',
          data: {
            queueName,
            timestamp: new Date().toISOString()
          }
        })

        return c.json({ message: result.message })
      } else {
        return c.json({ error: result.message }, 500)
      }
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  .delete('/:queueName/clear', requireAdmin, async (c) => {
    try {
      const queueName = c.req.param('queueName')
      const jobType = c.req.query('type') // completed, failed, or all

      if (!VALID_QUEUE_NAMES.includes(queueName as QueueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      const queueAdapter = await getQueueAdapter()
      const result = await queueAdapter.clearQueue(queueName as QueueName, jobType)

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

        return c.json({
          message: result.message,
          itemsRemoved: result.itemsRemoved
        })
      } else {
        return c.json({ error: result.message }, 500)
      }
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  .delete('/:queueName/purge', requireAdmin, async (c) => {
    try {
      const queueName = c.req.param('queueName')

      if (!VALID_QUEUE_NAMES.includes(queueName as QueueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      // Purge removes ALL jobs (equivalent to clear with type 'all')
      const queueAdapter = await getQueueAdapter()
      const result = await queueAdapter.clearQueue(queueName as QueueName, 'all')

      if (result.success) {
        return c.json({
          message: `Purged all jobs from queue ${queueName}`,
          itemsRemoved: result.itemsRemoved
        })
      } else {
        return c.json({ error: result.message }, 500)
      }
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  // Individual job actions
  .delete('/:queueName/jobs/:jobId', requireAdmin, async (c) => {
    try {
      const queueName = c.req.param('queueName')
      const jobId = c.req.param('jobId')

      if (!VALID_QUEUE_NAMES.includes(queueName as QueueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      const queueAdapter = await getQueueAdapter()
      const result = await queueAdapter.removeQueueJob(queueName as QueueName, jobId)

      if (result.success) {
        // Emit WebSocket event for job removal
        wsManager.broadcast({
          type: 'queue:job-removed',
          data: {
            queueName,
            jobId,
            timestamp: new Date().toISOString()
          }
        })

        return c.json({ message: result.message })
      } else {
        return c.json({ error: result.message }, 400)
      }
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  .post('/:queueName/jobs/:jobId/retry', requireAdmin, async (c) => {
    try {
      const queueName = c.req.param('queueName')
      const jobId = c.req.param('jobId')

      if (!VALID_QUEUE_NAMES.includes(queueName as QueueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      const queueAdapter = await getQueueAdapter()
      const result = await queueAdapter.retryQueueJob(queueName as QueueName, jobId)

      if (result.success) {
        // Emit WebSocket event for job retry
        wsManager.broadcast({
          type: 'queue:job-retried',
          data: {
            queueName,
            jobId,
            timestamp: new Date().toISOString()
          }
        })

        return c.json({ message: result.message })
      } else {
        return c.json({ error: result.message }, 400)
      }
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })
