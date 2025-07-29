import { Effect } from 'effect';
import { JobMonitoringService, type JobMonitoringData, type JobRunInfo } from './job-monitoring.service';
import { HttpError } from './job.service';
import { JobNotFoundError, ValidationError, DbError } from '@usersdotfun/shared-db';
import { Cause } from 'effect';
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
    constructor: error?.constructor?.name,
    isJobNotFoundError: error instanceof JobNotFoundError,
    isValidationError: error instanceof ValidationError,
    isDbError: error instanceof DbError,
    isRuntimeException: Cause.isRuntimeException(error),
    errorType: error?._tag,
  });
  
  let validationDetails = null;
  
  if (error instanceof ValidationError) {
    validationDetails = error.errors?.issues || error.errors;
  }
  else if (error?.message?.includes('Validation failed')) {
    const nestedError = error?.cause || error?.error || error;
    if (nestedError?.errors?.issues) {
      validationDetails = nestedError.errors.issues;
    } else if (nestedError?.errors) {
      validationDetails = nestedError.errors;
    }
  }
  
  if (validationDetails) {
    const formattedDetails = JSON.stringify(validationDetails, null, 2);
    console.error('Job Monitoring Validation Details:', formattedDetails);
    throw new HttpError(`Job monitoring validation failed: ${formattedDetails}`, 400);
  }
  
  if (error instanceof JobNotFoundError) {
    throw new HttpError('Job not found', 404);
  }
  
  if (error instanceof DbError) {
    throw new HttpError(`Job monitoring database error: ${error.message}`, 500);
  }
  
  if (Cause.isRuntimeException(error)) {
    throw new HttpError(`Job monitoring runtime error: ${error.message || 'Internal server error'}`, 500);
  }
  
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
