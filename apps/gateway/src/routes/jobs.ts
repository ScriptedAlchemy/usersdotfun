import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { getJobAdapter } from '../services/job.service'
import { getJobMonitoringAdapter } from '../services/job-monitoring-adapter.service'
import { getJobLifecycleAdapter } from '../services/job-lifecycle-adapter.service'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { getWebSocketManager } from '../services/websocket-manager.service'
import { honoErrorHandler } from '../utils/error-handlers'
import { QUEUE_NAMES } from '@usersdotfun/shared-queue'
import type { User } from '../types/hono'
import {
  JobIdParamSchema,
  JobStepParamsSchema,
  JobRunParamsSchema,
  JobsListQuerySchema,
  CreateJobRequestBodySchema,
  UpdateJobRequestBodySchema,
  ApiSuccessResponseSchema,
  ApiErrorResponseSchema,
  SimpleMessageDataSchema,
  JobsListDataSchema,
  JobWithStepsDataSchema,
  JobDataSchema,
  JobStatusSummaryDataSchema,
  JobMonitoringDataSchema,
  JobRunsListDataSchema,
  JobRunDetailsDataSchema,
  CleanupOrphanedJobsDataSchema,
} from '@usersdotfun/shared-types'

const wsManager = getWebSocketManager()

export const jobsRouter = new Hono()
  // Health check endpoint (no auth required)
  .get('/health', (c) => c.json({ status: 'ok' }))
  
  // User endpoints (authentication required)
  .get('/', 
    zValidator('query', JobsListQuerySchema),
    requireAuth, 
    async (c) => {
      try {
        const user = c.get('user') as User;
        const jobAdapter = await getJobAdapter()
        const jobs = await jobAdapter.getJobs()
        // Filter jobs by user if needed in the future
        const validatedJobs = JobsListDataSchema.parse(jobs)
        return c.json(ApiSuccessResponseSchema(JobsListDataSchema).parse({
          statusCode: 200,
          success: true,
          data: validatedJobs,
          timestamp: new Date().toISOString(),
        }))
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  .get('/:id', 
    zValidator('param', JobIdParamSchema),
    requireAuth, 
    async (c) => {
      try {
        const jobAdapter = await getJobAdapter()
        const job = await jobAdapter.getJobById(c.req.param('id'))
        const steps = await jobAdapter.getStepsForJob(c.req.param('id'))
        const jobWithSteps = { ...job, steps }
        const validatedJob = JobWithStepsDataSchema.parse(jobWithSteps)
        return c.json(ApiSuccessResponseSchema(JobWithStepsDataSchema).parse({
          statusCode: 200,
          success: true,
          data: validatedJob,
          timestamp: new Date().toISOString(),
        }))
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  // Admin-only endpoints
  .post('/', 
    zValidator('json', CreateJobRequestBodySchema),
    requireAdmin, 
    async (c) => {
      try {
        const validatedBody = c.req.valid('json')
        const lifecycleAdapter = await getJobLifecycleAdapter()
        const job = await lifecycleAdapter.createJobWithScheduling(validatedBody)
        
        // Emit WebSocket events for proper cache invalidation
        wsManager.broadcast({
          type: 'job:status-changed',
          data: {
            job: job,
            timestamp: new Date().toISOString(),
          },
        })
        
        const validatedJob = JobDataSchema.parse(job)
        return c.json(ApiSuccessResponseSchema(JobDataSchema).parse({
          statusCode: 201,
          success: true,
          data: validatedJob,
          timestamp: new Date().toISOString(),
        }), 201)
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  .post('/definition', 
    zValidator('json', CreateJobRequestBodySchema),
    requireAdmin, 
    async (c) => {
      try {
        const validatedBody = c.req.valid('json')
        const lifecycleAdapter = await getJobLifecycleAdapter()
        const job = await lifecycleAdapter.createJobWithScheduling(validatedBody)
        
        // Emit WebSocket events for proper cache invalidation
        wsManager.broadcast({
          type: 'job:status-changed',
          data: {
            job: job,
            timestamp: new Date().toISOString(),
          },
        })
        
        const validatedJob = JobDataSchema.parse(job)
        return c.json(ApiSuccessResponseSchema(JobDataSchema).parse({
          statusCode: 201,
          success: true,
          data: validatedJob,
          timestamp: new Date().toISOString(),
        }), 201)
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  .put('/:id', 
    zValidator('param', JobIdParamSchema),
    zValidator('json', UpdateJobRequestBodySchema),
    requireAdmin, 
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const validatedBody = c.req.valid('json')
        const lifecycleAdapter = await getJobLifecycleAdapter()
        const job = await lifecycleAdapter.updateJobWithScheduling(validatedParams.id, validatedBody)
        
        const validatedJob = JobDataSchema.parse(job)
        return c.json(ApiSuccessResponseSchema(JobDataSchema).parse({
          statusCode: 200,
          success: true,
          data: validatedJob,
          timestamp: new Date().toISOString(),
        }))
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  .delete('/:id', 
    zValidator('param', JobIdParamSchema),
    requireAdmin, 
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const lifecycleAdapter = await getJobLifecycleAdapter()
        
        // Delete the job
        await lifecycleAdapter.deleteJobWithCleanup(validatedParams.id)
        
        // Emit WebSocket events for proper cache invalidation
        wsManager.broadcast({
          type: 'job:deleted',
          data: {
            jobId: validatedParams.id,
            timestamp: new Date().toISOString(),
          },
        })
        
        return c.body(null, 204)
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  // Monitoring endpoints (authenticated users)
  .get('/:id/status', 
    zValidator('param', JobIdParamSchema),
    requireAuth, 
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const monitoringAdapter = await getJobMonitoringAdapter()
        const status = await monitoringAdapter.getJobStatus(validatedParams.id)
        const validatedStatus = JobStatusSummaryDataSchema.parse(status)
        return c.json(ApiSuccessResponseSchema(JobStatusSummaryDataSchema).parse({
          statusCode: 200,
          success: true,
          data: validatedStatus,
          timestamp: new Date().toISOString(),
        }))
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  .get('/:id/monitoring', 
    zValidator('param', JobIdParamSchema),
    requireAuth, 
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const monitoringAdapter = await getJobMonitoringAdapter()
        const data = await monitoringAdapter.getJobMonitoringData(validatedParams.id)
        const validatedData = JobMonitoringDataSchema.parse(data)
        return c.json(ApiSuccessResponseSchema(JobMonitoringDataSchema).parse({
          statusCode: 200,
          success: true,
          data: validatedData,
          timestamp: new Date().toISOString(),
        }))
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  .get('/:id/runs', 
    zValidator('param', JobIdParamSchema),
    requireAuth, 
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const monitoringAdapter = await getJobMonitoringAdapter()
        const runs = await monitoringAdapter.getJobRuns(validatedParams.id)
        const validatedRuns = JobRunsListDataSchema.parse(runs)
        return c.json(ApiSuccessResponseSchema(JobRunsListDataSchema).parse({
          statusCode: 200,
          success: true,
          data: validatedRuns,
          timestamp: new Date().toISOString(),
        }))
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  .get('/:id/runs/:runId', 
    zValidator('param', JobRunParamsSchema),
    requireAuth, 
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const monitoringAdapter = await getJobMonitoringAdapter()
        const runDetails = await monitoringAdapter.getJobRunDetails(
          validatedParams.id,
          validatedParams.runId
        )
        const validatedRunDetails = JobRunDetailsDataSchema.parse(runDetails)
        return c.json(ApiSuccessResponseSchema(JobRunDetailsDataSchema).parse({
          statusCode: 200,
          success: true,
          data: validatedRunDetails,
          timestamp: new Date().toISOString(),
        }))
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  // Retry endpoints (admin-only)
  .post('/:id/retry', 
    zValidator('param', JobIdParamSchema),
    requireAdmin, 
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const lifecycleAdapter = await getJobLifecycleAdapter()
        const jobAdapter = await getJobAdapter()
        
        // First retry the job in the database (sets status to 'pending')
        await jobAdapter.retryJob(validatedParams.id)
        
        // Then get the updated job and handle scheduling
        const updatedJob = await jobAdapter.getJobById(validatedParams.id)
        await lifecycleAdapter.updateJobWithScheduling(validatedParams.id, { status: 'pending' })
        
        // Get the final updated job and broadcast the retry event
        const finalJob = await jobAdapter.getJobById(validatedParams.id)
        wsManager.broadcast({
          type: 'queue:job-retried',
          data: {
            queueName: QUEUE_NAMES.SOURCE_JOBS,
            job: finalJob,
            timestamp: new Date().toISOString(),
          },
        })
        
        const message = { message: 'Job retry initiated' }
        const validatedMessage = SimpleMessageDataSchema.parse(message)
        return c.json(ApiSuccessResponseSchema(SimpleMessageDataSchema).parse({
          statusCode: 200,
          success: true,
          data: validatedMessage,
          timestamp: new Date().toISOString(),
        }))
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  .post('/:id/steps/:stepId/retry', 
    zValidator('param', JobStepParamsSchema),
    requireAdmin, 
    async (c) => {
      try {
        const validatedParams = c.req.valid('param')
        const jobAdapter = await getJobAdapter()
        await jobAdapter.retryPipelineStep(validatedParams.stepId)
        
        const message = { message: 'Step retry initiated' }
        const validatedMessage = SimpleMessageDataSchema.parse(message)
        return c.json(ApiSuccessResponseSchema(SimpleMessageDataSchema).parse({
          statusCode: 200,
          success: true,
          data: validatedMessage,
          timestamp: new Date().toISOString(),
        }))
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })

  // Admin maintenance endpoints
  .post('/cleanup/orphaned', 
    requireAdmin, 
    async (c) => {
      try {
        const lifecycleAdapter = await getJobLifecycleAdapter()
        const result = await lifecycleAdapter.cleanupOrphanedJobs()
        const cleanupResult = {
          message: `Cleaned up ${result.cleaned} orphaned jobs`,
          cleaned: result.cleaned,
          details: {
            orphanedJobs: result.errors || [],
            cleanupTime: new Date().toISOString(),
          }
        }
        const validatedResult = CleanupOrphanedJobsDataSchema.parse(cleanupResult)
        return c.json(ApiSuccessResponseSchema(CleanupOrphanedJobsDataSchema).parse({
          statusCode: 200,
          success: true,
          data: validatedResult,
          timestamp: new Date().toISOString(),
        }))
      } catch (error) {
        return honoErrorHandler(c, error)
      }
    })
