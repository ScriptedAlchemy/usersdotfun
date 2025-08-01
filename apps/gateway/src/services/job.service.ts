import {
  WorkflowService
} from '@usersdotfun/shared-db'
import {
  type InsertJobData,
  type SelectJob,
  type SelectPipelineStep,
  type UpdateJobData
} from '@usersdotfun/shared-db/src/schema'
import {
  type CreateWorkflow
} from '@usersdotfun/shared-types/types'
import { Effect } from 'effect'
import { AppLayer } from '../runtime'
import { toHttpError } from '../utils/error-handlers'

const handleEffectError = (error: any): never => {
  throw toHttpError(error);
}

export interface JobAdapter {
  getJobs(): Promise<SelectJob[]>
  getJobById(id: string): Promise<SelectJob>
  getStepsForJob(jobId: string): Promise<SelectPipelineStep[]>
  createJob(data: InsertJobData): Promise<SelectJob>
  createWorkflow(data: CreateWorkflow): Promise<SelectJob>
  updateJob(id: string, data: UpdateJobData): Promise<SelectJob>
  deleteJob(id: string): Promise<void>
  retryJob(id: string): Promise<void>
  retryPipelineStep(id: string): Promise<void>
}

export class JobAdapterImpl implements JobAdapter {
  async getJobs() {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobService = yield* WorkflowService;
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
        const jobService = yield* WorkflowService;
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
        const jobService = yield* WorkflowService;
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
        const jobService = yield* WorkflowService;
        return yield* jobService.createJob(data);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async createWorkflow(data: CreateWorkflow) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobService = yield* WorkflowService;
        return yield* jobService.createWorkflow(data);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async updateJob(id: string, data: UpdateJobData) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobService = yield* WorkflowService;
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
        const jobService = yield* WorkflowService;
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
        const jobService = yield* WorkflowService;
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
        const jobService = yield* WorkflowService;
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
