import { Effect } from 'effect';
import { JobMonitoringService, type JobMonitoringData, type JobRunInfo } from './job-monitoring.service';
import { HttpError } from './job.service';
import { AppLayer } from '../runtime';

export interface JobMonitoringAdapter {
  getJobMonitoringData(jobId: string): Promise<JobMonitoringData>;
  getJobStatus(jobId: string): Promise<{
    status: string;
    queuePosition?: number;
    estimatedStartTime?: Date;
    currentRun?: JobRunInfo;
  }>;
  getJobRuns(jobId: string): Promise<JobRunInfo[]>;
  getJobRunDetails(jobId: string, runId: string): Promise<{
    run: JobRunInfo;
    pipelineItems: any[];
  }>;
}

const handleEffectError = (error: any): never => {
  console.error('Job Monitoring Effect Error:', {
    error,
    message: error?.message,
    cause: error?.cause,
    stack: error?.stack,
  });
  
  throw new HttpError(`Job monitoring error: ${error?.message || 'An unexpected error occurred'}`, 500);
};

export class JobMonitoringAdapterImpl implements JobMonitoringAdapter {
  async getJobMonitoringData(jobId: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobMonitoringService = yield* JobMonitoringService;
        return yield* jobMonitoringService.getJobMonitoringData(jobId);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async getJobStatus(jobId: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobMonitoringService = yield* JobMonitoringService;
        return yield* jobMonitoringService.getJobStatus(jobId);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async getJobRuns(jobId: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobMonitoringService = yield* JobMonitoringService;
        return yield* jobMonitoringService.getJobRuns(jobId);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async getJobRunDetails(jobId: string, runId: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const jobMonitoringService = yield* JobMonitoringService;
        return yield* jobMonitoringService.getJobRunDetails(jobId, runId);
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }
}

let jobMonitoringAdapter: JobMonitoringAdapter | null = null;

export async function getJobMonitoringAdapter(): Promise<JobMonitoringAdapter> {
  if (!jobMonitoringAdapter) {
    jobMonitoringAdapter = new JobMonitoringAdapterImpl();
  }
  return jobMonitoringAdapter;
}