import { Hono } from 'hono'
import { getJobAdapter } from '../services/job.service'
import { getJobMonitoringAdapter } from '../services/job-monitoring-adapter.service'
import { getJobLifecycleAdapter } from '../services/job-lifecycle-adapter.service'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { getWebSocketManager } from '../services/websocket-manager.service'
import { honoErrorHandler } from '../utils/error-handlers'
import { QUEUE_NAMES } from '@usersdotfun/shared-queue'
import type { User } from '../types/hono'

const wsManager = getWebSocketManager()

export const jobsRouter = new Hono()
  // Health check endpoint (no auth required)
  .get('/health', (c) => c.json({ status: 'ok' }))
  
  // User endpoints (authentication required)
  .get('/', requireAuth, async (c) => {
    try {
      const user = c.get('user') as User;
      const jobAdapter = await getJobAdapter()
      const jobs = await jobAdapter.getJobs()
      // Filter jobs by user if needed in the future
      return c.json(jobs)
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  .get('/:id', requireAuth, async (c) => {
    try {
      const jobAdapter = await getJobAdapter()
      const job = await jobAdapter.getJobById(c.req.param('id'))
      const steps = await jobAdapter.getStepsForJob(c.req.param('id'))
      return c.json({ ...job, steps })
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  // Admin-only endpoints
  .post('/', requireAdmin, async (c) => {
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
      return honoErrorHandler(c, error)
    }
  })

  .post('/definition', requireAdmin, async (c) => {
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
      return honoErrorHandler(c, error)
    }
  })

  .put('/:id', requireAdmin, async (c) => {
    try {
      const lifecycleAdapter = await getJobLifecycleAdapter()
      const body = await c.req.json()
      const job = await lifecycleAdapter.updateJobWithScheduling(c.req.param('id'), body)
      return c.json(job)
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  .delete('/:id', requireAdmin, async (c) => {
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
      return honoErrorHandler(c, error)
    }
  })

  // Monitoring endpoints (authenticated users)
  .get('/:id/status', requireAuth, async (c) => {
    try {
      const monitoringAdapter = await getJobMonitoringAdapter()
      const status = await monitoringAdapter.getJobStatus(c.req.param('id'))
      return c.json(status)
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  .get('/:id/monitoring', requireAuth, async (c) => {
    try {
      const monitoringAdapter = await getJobMonitoringAdapter()
      const data = await monitoringAdapter.getJobMonitoringData(c.req.param('id'))
      return c.json(data)
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  .get('/:id/runs', requireAuth, async (c) => {
    try {
      const monitoringAdapter = await getJobMonitoringAdapter()
      const runs = await monitoringAdapter.getJobRuns(c.req.param('id'))
      return c.json(runs)
    } catch (error) {
      return honoErrorHandler(c, error)
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
      return honoErrorHandler(c, error)
    }
  })

  // Retry endpoints (admin-only)
  .post('/:id/retry', requireAdmin, async (c) => {
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
          queueName: QUEUE_NAMES.SOURCE_JOBS,
          job: finalJob,
          timestamp: new Date().toISOString(),
        },
      })
      
      return c.json({ message: 'Job retry initiated' })
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  .post('/:id/steps/:stepId/retry', requireAdmin, async (c) => {
    try {
      const jobAdapter = await getJobAdapter()
      await jobAdapter.retryPipelineStep(c.req.param('stepId'))
      return c.json({ message: 'Step retry initiated' })
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })

  // Admin maintenance endpoints
  .post('/cleanup/orphaned', requireAdmin, async (c) => {
    try {
      const lifecycleAdapter = await getJobLifecycleAdapter()
      const result = await lifecycleAdapter.cleanupOrphanedJobs()
      return c.json({
        message: `Cleaned up ${result.cleaned} orphaned jobs`,
        ...result
      })
    } catch (error) {
      return honoErrorHandler(c, error)
    }
  })
