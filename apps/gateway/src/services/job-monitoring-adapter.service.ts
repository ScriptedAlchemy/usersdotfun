import type {
  JobMonitoringData,
  JobRunInfo,
  JobRunDetails,
  JobStatusSummary,
} from '@usersdotfun/shared-types/types';
import { Effect } from 'effect';
import { toHttpError } from '../utils/error-handlers';
import { JobMonitoringService } from './job-monitoring.service';
import { AppLayer } from '../runtime';

export interface JobMonitoringAdapter {
  getJobMonitoringData(jobId: string): Promise<JobMonitoringData>;
  getJobStatus(jobId: string): Promise<JobStatusSummary>;
  getJobRuns(jobId: string): Promise<JobRunInfo[]>;
  getJobRunDetails(jobId: string, runId: string): Promise<JobRunDetails>;
}

const handleEffectError = (error: any): never => {
  throw toHttpError(error);
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
