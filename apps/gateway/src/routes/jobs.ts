import { Hono } from 'hono';
import { JobService, JobServiceLive } from '@usersdotfun/shared-db';
import { Effect, Layer } from 'effect';
import { DatabaseLive } from '~/db';

const JobsLive = Layer.provide(JobServiceLive, DatabaseLive);

const jobsRouter = new Hono()
  .get('/', async (c) => {
    const jobService = await Layer.run(JobsLive);
    const jobs = await Effect.runPromise(jobService.getJobs());
    return c.json(jobs);
  })
  .get('/:id', async (c) => {
    const jobService = await Layer.run(JobsLive);
    const job = await Effect.runPromise(jobService.getJobById(c.req.param('id')));
    return c.json(job);
  })
  .post('/', async (c) => {
    const jobService = await Layer.run(JobsLive);
    const body = await c.req.json();
    const newJob = await Effect.runPromise(jobService.createJob(body));
    return c.json(newJob, 201);
  })
  .put('/:id', async (c) => {
    const jobService = await Layer.run(JobsLive);
    const body = await c.req.json();
    const updatedJob = await Effect.runPromise(jobService.updateJob(c.req.param('id'), body));
    return c.json(updatedJob);
  })
  .delete('/:id', async (c) => {
    const jobService = await Layer.run(JobsLive);
    await Effect.runPromise(jobService.deleteJob(c.req.param('id')));
    return c.body(null, 204);
  });

export { jobsRouter };
