import { Effect } from 'effect';
import { AppLayer } from '../runtime';
import { toHttpError } from '../utils/error-handlers';
import { JobLifecycleService, type CreateJobPayload, type UpdateJobPayload } from './job-lifecycle.service';
import type { Job } from '@usersdotfun/shared-types/types';

export interface JobLifecycleAdapter {
  deleteJobWithCleanup(jobId: string): Promise<void>;
  createJobWithScheduling(jobData: CreateJobPayload): Promise<Job>;
  updateJobWithScheduling(jobId: string, jobData: UpdateJobPayload): Promise<Job>;
  cleanupOrphanedJobs(): Promise<{ cleaned: number; errors: string[] }>;
}

const handleEffectError = (error: any): never => {
  throw toHttpError(error);
};

export class JobLifecycleAdapterImpl implements JobLifecycleAdapter {
  async deleteJobWithCleanup(jobId: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobLifecycleService = yield* JobLifecycleService;
        return yield* jobLifecycleService.deleteJobWithCleanup(jobId);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async createJobWithScheduling(jobData: CreateJobPayload): Promise<Job> {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobLifecycleService = yield* JobLifecycleService;
        return yield* jobLifecycleService.createJobWithScheduling(jobData);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async updateJobWithScheduling(jobId: string, jobData: UpdateJobPayload): Promise<Job> {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobLifecycleService = yield* JobLifecycleService;
        return yield* jobLifecycleService.updateJobWithScheduling(jobId, jobData);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async cleanupOrphanedJobs() {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobLifecycleService = yield* JobLifecycleService;
        return yield* jobLifecycleService.cleanupOrphanedJobs();
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }
}

let jobLifecycleAdapter: JobLifecycleAdapter;

export async function getJobLifecycleAdapter(): Promise<JobLifecycleAdapter> {
  if (!jobLifecycleAdapter) {
    jobLifecycleAdapter = new JobLifecycleAdapterImpl();
  }
  return jobLifecycleAdapter;
}
