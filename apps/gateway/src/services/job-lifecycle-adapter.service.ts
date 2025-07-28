import { Effect } from 'effect';
import { JobLifecycleService } from './job-lifecycle.service';
import { HttpError } from './job.service';
import { AppLayer } from '../runtime';

export interface JobLifecycleAdapter {
  deleteJobWithCleanup(jobId: string): Promise<void>;
  createJobWithScheduling(jobData: any): Promise<any>;
  updateJobWithScheduling(jobId: string, jobData: any): Promise<any>;
  cleanupOrphanedJobs(): Promise<{ cleaned: number; errors: string[] }>;
}

const handleEffectError = (error: any): never => {
  console.error('Job Lifecycle Effect Error:', {
    error,
    message: error?.message,
    cause: error?.cause,
    stack: error?.stack,
  });
  
  throw new HttpError(`Job lifecycle error: ${error?.message || 'An unexpected error occurred'}`, 500);
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

  async createJobWithScheduling(jobData: any) {
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

  async updateJobWithScheduling(jobId: string, jobData: any) {
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

let jobLifecycleAdapter: JobLifecycleAdapter | null = null;

export async function getJobLifecycleAdapter(): Promise<JobLifecycleAdapter> {
  if (!jobLifecycleAdapter) {
    jobLifecycleAdapter = new JobLifecycleAdapterImpl();
  }
  return jobLifecycleAdapter;
}
