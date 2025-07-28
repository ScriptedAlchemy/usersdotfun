import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { HttpError } from '../services/job.service'
import { getQueueAdapter } from '../services/queue-adapter.service'

const handleError = (c: any, error: any) => {
  console.error('Queue Gateway Error:', {
    message: error.message,
    stack: error.stack,
    cause: error.cause,
    name: error.constructor.name,
    error: error
  })
  
  if (error instanceof HttpError) {
    return c.json({ error: error.message }, error.status)
  }
  
  const isDev = process.env.NODE_ENV !== 'production'
  return c.json({ 
    error: isDev ? error.message : 'Internal Server Error',
    details: isDev ? error.stack : 'An unexpected error occurred'
  }, 500)
}

export const queuesRouter = new Hono()
  // Get overall queue status
  .get('/status', requireAuth, async (c) => {
    try {
      const queueAdapter = await getQueueAdapter()
      const result = await queueAdapter.getQueuesOverview()
      return c.json(result)
    } catch (error) {
      return handleError(c, error)
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
      return handleError(c, error)
    }
  })

  // Get detailed queue information
  .get('/:queueName', requireAuth, async (c) => {
    try {
      const queueName = c.req.param('queueName')
      
      if (!['source-jobs', 'pipeline-jobs'].includes(queueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      const queueAdapter = await getQueueAdapter()
      const result = await queueAdapter.getQueueDetails(queueName)
      return c.json(result)
    } catch (error) {
      return handleError(c, error)
    }
  })

  // Get queue items with pagination
  .get('/:queueName/items', requireAuth, async (c) => {
    try {
      const queueName = c.req.param('queueName')
      const status = c.req.query('status') || 'waiting' // waiting, active, completed, failed
      const page = parseInt(c.req.query('page') || '1')
      const limit = parseInt(c.req.query('limit') || '50')
      
      if (!['source-jobs', 'pipeline-jobs'].includes(queueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      const queueAdapter = await getQueueAdapter()
      const result = await queueAdapter.getQueueItems(queueName, status, page, limit)
      return c.json(result)
    } catch (error) {
      return handleError(c, error)
    }
  })

  // Queue management actions (admin only)
  .post('/:queueName/pause', requireAuth, async (c) => {
    try {
      const queueName = c.req.param('queueName')
      
      if (!['source-jobs', 'pipeline-jobs'].includes(queueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      // TODO: Implement queue pause functionality
      // This would require extending the QueueService to support pause/resume operations
      return c.json({ message: 'Queue pause functionality not yet implemented' }, 501)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .post('/:queueName/resume', requireAuth, async (c) => {
    try {
      const queueName = c.req.param('queueName')
      
      if (!['source-jobs', 'pipeline-jobs'].includes(queueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      // TODO: Implement queue resume functionality
      return c.json({ message: 'Queue resume functionality not yet implemented' }, 501)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .delete('/:queueName/clear', requireAuth, async (c) => {
    try {
      const queueName = c.req.param('queueName')
      
      if (!['source-jobs', 'pipeline-jobs'].includes(queueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      // TODO: Implement queue clear functionality
      return c.json({ message: 'Queue clear functionality not yet implemented' }, 501)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .delete('/:queueName/purge', requireAuth, async (c) => {
    try {
      const queueName = c.req.param('queueName')
      
      if (!['source-jobs', 'pipeline-jobs'].includes(queueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      // TODO: Implement queue purge functionality
      return c.json({ message: 'Queue purge functionality not yet implemented' }, 501)
    } catch (error) {
      return handleError(c, error)
    }
  })

  // Individual job actions
  .delete('/:queueName/jobs/:jobId', requireAuth, async (c) => {
    try {
      const queueName = c.req.param('queueName')
      const jobId = c.req.param('jobId')
      
      if (!['source-jobs', 'pipeline-jobs'].includes(queueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      // TODO: Implement individual job removal
      return c.json({ message: 'Job removal functionality not yet implemented' }, 501)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .post('/:queueName/jobs/:jobId/retry', requireAuth, async (c) => {
    try {
      const queueName = c.req.param('queueName')
      const jobId = c.req.param('jobId')
      
      if (!['source-jobs', 'pipeline-jobs'].includes(queueName)) {
        return c.json({ error: 'Invalid queue name' }, 400)
      }

      // TODO: Implement individual job retry
      return c.json({ message: 'Job retry functionality not yet implemented' }, 501)
    } catch (error) {
      return handleError(c, error)
    }
  })
