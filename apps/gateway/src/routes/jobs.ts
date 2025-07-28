import { Hono } from 'hono'
import { getJobAdapter, HttpError } from '../services/job.service'

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
  .get('/', async (c) => {
    try {
      const jobAdapter = await getJobAdapter()
      const jobs = await jobAdapter.getJobs()
      return c.json(jobs)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .get('/:id', async (c) => {
    try {
      const jobAdapter = await getJobAdapter()
      const job = await jobAdapter.getJobById(c.req.param('id'))
      return c.json(job)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .post('/', async (c) => {
    try {
      const jobAdapter = await getJobAdapter()
      const body = await c.req.json()
      const job = await jobAdapter.createJob(body)
      return c.json(job, 201)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .put('/:id', async (c) => {
    try {
      const jobAdapter = await getJobAdapter()
      const body = await c.req.json()
      const job = await jobAdapter.updateJob(c.req.param('id'), body)
      return c.json(job)
    } catch (error) {
      return handleError(c, error)
    }
  })

  .delete('/:id', async (c) => {
    try {
      const jobAdapter = await getJobAdapter()
      await jobAdapter.deleteJob(c.req.param('id'))
      return c.body(null, 204)
    } catch (error) {
      return handleError(c, error)
    }
  })
