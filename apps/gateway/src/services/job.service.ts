import { 
  JobNotFoundError, 
  JobService, 
  ValidationError, 
  DbError
} from '@usersdotfun/shared-db'
import {
  type SelectJob,
  type InsertJobData,
  type UpdateJobData,
  type SelectPipelineStep
} from '@usersdotfun/shared-db/src/schema'
import { 
  type CreateJobDefinition 
} from '@usersdotfun/shared-types'
import { Cause, Effect } from 'effect'
import { AppLayer } from '../runtime'
import { toHttpError, HttpError } from '../utils/error-handlers'

const handleEffectError = (error: any): never => {
  throw toHttpError(error);
}

export interface JobAdapter {
  getJobs(): Promise<SelectJob[]>
  getJobById(id: string): Promise<SelectJob>
  getStepsForJob(jobId: string): Promise<SelectPipelineStep[]>
  createJob(data: InsertJobData): Promise<SelectJob>
  createJobDefinition(data: CreateJobDefinition): Promise<SelectJob>
  updateJob(id: string, data: UpdateJobData): Promise<SelectJob>
  deleteJob(id: string): Promise<void>
  retryJob(id: string): Promise<void>
  retryPipelineStep(id: string): Promise<void>
}

export class JobAdapterImpl implements JobAdapter {
  async getJobs() {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobService = yield* JobService;
        return yield* jobService.getJobs();
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async getJobById(id: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobService = yield* JobService;
        return yield* jobService.getJobById(id);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async getStepsForJob(jobId: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobService = yield* JobService;
        return yield* jobService.getStepsForJob(jobId);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async createJob(data: InsertJobData) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobService = yield* JobService;
        return yield* jobService.createJob(data);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async createJobDefinition(data: CreateJobDefinition) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobService = yield* JobService;
        return yield* jobService.createJobDefinition(data);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async updateJob(id: string, data: UpdateJobData) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobService = yield* JobService;
        return yield* jobService.updateJob(id, data);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async deleteJob(id: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobService = yield* JobService;
        return yield* jobService.deleteJob(id);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async retryJob(id: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobService = yield* JobService;
        return yield* jobService.retryJob(id);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async retryPipelineStep(id: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobService = yield* JobService;
        return yield* jobService.retryPipelineStep(id);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }
}

let jobAdapter: JobAdapter | null = null;

export async function getJobAdapter(): Promise<JobAdapter> {
  if (!jobAdapter) {
    jobAdapter = new JobAdapterImpl();
  }
  return jobAdapter;
}
