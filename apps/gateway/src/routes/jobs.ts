import { Hono } from 'hono'
import { getJobAdapter, HttpError } from '../services/job.service'
import { getJobMonitoringAdapter } from '../services/job-monitoring-adapter.service'
import { getJobLifecycleAdapter } from '../services/job-lifecycle-adapter.service'
import { requireAuth } from '../middleware/auth'
import { wsManager } from './websocket'

const handleError = (c: any, error: any) => {
  console.error('Gateway Error:', {
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

export const jobsRouter = new Hono()
  // Health check endpoint (no auth required)
  .get('/health', (c) => c.json({ status: 'ok' }))
  
  // User endpoints (authentication required)
  .get('/', requireAuth, async (c) => {
    try {
      const user = c.get('user') as any
      const jobAdapter = await getJobAdapter()
      const jobs = await jobAdapter.getJobs()
      // Filter jobs by user if needed in the future
      return c.json(jobs)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .get('/:id', requireAuth, async (c) => {
    try {
      const jobAdapter = await getJobAdapter()
      const job = await jobAdapter.getJobById(c.req.param('id'))
      const steps = await jobAdapter.getStepsForJob(c.req.param('id'))
      return c.json({ ...job, steps })
    } catch (error) {
      return handleError(c, error)
    }
  })

  // Admin-only endpoints
  .post('/', requireAuth, async (c) => {
    try {
      const lifecycleAdapter = await getJobLifecycleAdapter()
      const body = await c.req.json()
      const job = await lifecycleAdapter.createJobWithScheduling(body)
      
      // Emit WebSocket events for proper cache invalidation
      wsManager.broadcast({
        type: 'job:status-changed',
        data: {
          job: job,
          timestamp: new Date().toISOString(),
        },
      })
      
      return c.json(job, 201)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .post('/definition', requireAuth, async (c) => {
    try {
      const lifecycleAdapter = await getJobLifecycleAdapter()
      const body = await c.req.json()
      const job = await lifecycleAdapter.createJobWithScheduling(body)
      
      // Emit WebSocket events for proper cache invalidation
      wsManager.broadcast({
        type: 'job:status-changed',
        data: {
          job: job,
          timestamp: new Date().toISOString(),
        },
      })
      
      return c.json(job, 201)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .put('/:id', requireAuth, async (c) => {
    try {
      const lifecycleAdapter = await getJobLifecycleAdapter()
      const body = await c.req.json()
      const job = await lifecycleAdapter.updateJobWithScheduling(c.req.param('id'), body)
      return c.json(job)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .delete('/:id', requireAuth, async (c) => {
    try {
      const jobId = c.req.param('id')
      const lifecycleAdapter = await getJobLifecycleAdapter()
      
      // Delete the job
      await lifecycleAdapter.deleteJobWithCleanup(jobId)
      
      // Emit WebSocket events for proper cache invalidation
      wsManager.broadcast({
        type: 'job:deleted',
        data: {
          jobId,
          timestamp: new Date().toISOString(),
        },
      })
      
      
      return c.body(null, 204)
    } catch (error) {
      return handleError(c, error)
    }
  })

  // Monitoring endpoints (authenticated users)
  .get('/:id/status', requireAuth, async (c) => {
    try {
      const monitoringAdapter = await getJobMonitoringAdapter()
      const status = await monitoringAdapter.getJobStatus(c.req.param('id'))
      return c.json(status)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .get('/:id/monitoring', requireAuth, async (c) => {
    try {
      const monitoringAdapter = await getJobMonitoringAdapter()
      const data = await monitoringAdapter.getJobMonitoringData(c.req.param('id'))
      return c.json(data)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .get('/:id/runs', requireAuth, async (c) => {
    try {
      const monitoringAdapter = await getJobMonitoringAdapter()
      const runs = await monitoringAdapter.getJobRuns(c.req.param('id'))
      return c.json(runs)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .get('/:id/runs/:runId', requireAuth, async (c) => {
    try {
      const monitoringAdapter = await getJobMonitoringAdapter()
      const runDetails = await monitoringAdapter.getJobRunDetails(
        c.req.param('id'),
        c.req.param('runId')
      )
      return c.json(runDetails)
    } catch (error) {
      return handleError(c, error)
    }
  })

  // Retry endpoints (admin-only)
  .post('/:id/retry', requireAuth, async (c) => {
    try {
      const lifecycleAdapter = await getJobLifecycleAdapter()
      const jobAdapter = await getJobAdapter()
      
      // First retry the job in the database (sets status to 'pending')
      await jobAdapter.retryJob(c.req.param('id'))
      
      // Then get the updated job and handle scheduling
      const updatedJob = await jobAdapter.getJobById(c.req.param('id'))
      await lifecycleAdapter.updateJobWithScheduling(c.req.param('id'), { status: 'pending' })
      
      // Get the final updated job and broadcast the retry event
      const finalJob = await jobAdapter.getJobById(c.req.param('id'))
      wsManager.broadcast({
        type: 'queue:job-retried',
        data: {
          queueName: 'source', // Default queue name, could be made dynamic
          job: finalJob,
          timestamp: new Date().toISOString(),
        },
      })
      
      return c.json({ message: 'Job retry initiated' })
    } catch (error) {
      return handleError(c, error)
    }
  })

  .post('/:id/steps/:stepId/retry', requireAuth, async (c) => {
    try {
      const jobAdapter = await getJobAdapter()
      await jobAdapter.retryPipelineStep(c.req.param('stepId'))
      return c.json({ message: 'Step retry initiated' })
    } catch (error) {
      return handleError(c, error)
    }
  })

  // Admin maintenance endpoints
  .post('/cleanup/orphaned', requireAuth, async (c) => {
    try {
      const lifecycleAdapter = await getJobLifecycleAdapter()
      const result = await lifecycleAdapter.cleanupOrphanedJobs()
      return c.json({
        message: `Cleaned up ${result.cleaned} orphaned jobs`,
        ...result
      })
    } catch (error) {
      return handleError(c, error)
    }
  })
