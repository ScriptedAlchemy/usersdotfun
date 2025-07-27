// src/routes/jobs.ts - Clean routes with no Effect
import { Hono } from 'hono'
import { getJobAdapter } from '../services/job.service'

export const jobsRouter = new Hono()
  .get('/', async (c) => {
    try {
      const jobAdapter = await getJobAdapter()
      const jobs = await jobAdapter.getJobs()
      return c.json(jobs)
    } catch (error) {
      return c.json({ error: String(error) }, 500)
    }
  })
  
  .get('/:id', async (c) => {
    try {
      const jobAdapter = await getJobAdapter()
      const job = await jobAdapter.getJobById(c.req.param('id'))
      return c.json(job)
    } catch (error: any) {
      const status = error.status || 500
      return c.json({ error: error.message }, status)
    }
  })
  
  .post('/', async (c) => {
    try {
      const jobAdapter = await getJobAdapter()
      const body = await c.req.json()
      const job = await jobAdapter.createJob(body)
      return c.json(job, 201)
    } catch (error: any) {
      const status = error.status || 500
      return c.json({ error: error.message }, status)
    }
  })
  
  .put('/:id', async (c) => {
    try {
      const jobAdapter = await getJobAdapter()
      const body = await c.req.json()
      const job = await jobAdapter.updateJob(c.req.param('id'), body)
      return c.json(job)
    } catch (error: any) {
      const status = error.status || 500
      return c.json({ error: error.message }, status)
    }
  })
  
  .delete('/:id', async (c) => {
    try {
      const jobAdapter = await getJobAdapter()
      await jobAdapter.deleteJob(c.req.param('id'))
      return c.body(null, 204)
    } catch (error: any) {
      const status = error.status || 500
      return c.json({ error: error.message }, status)
    }
  })