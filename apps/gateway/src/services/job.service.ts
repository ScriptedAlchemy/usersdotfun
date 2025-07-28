import { JobNotFoundError, JobService, ValidationError, DbError } from '@usersdotfun/shared-db'
import { Cause, Effect } from 'effect'
import { AppLayer } from '../runtime'

export class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

const handleEffectError = (error: any): never => {
  console.error('Effect Error Details:', {
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
    errorData: error?.errors,
    nestedError: error?.error,
    errorCause: error?.cause,
    allKeys: Object.keys(error || {})
  })
  
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
    console.error('Extracted Validation Details:', formattedDetails);
    throw new HttpError(`Validation failed: ${formattedDetails}`, 400);
  }
  
  if (error instanceof JobNotFoundError) {
    throw new HttpError('Job not found', 404)
  }
  
  if (error instanceof DbError) {
    throw new HttpError(`Database error: ${error.message}`, 500)
  }
  
  if (Cause.isRuntimeException(error)) {
    throw new HttpError(`Runtime error: ${error.message || 'Internal server error'}`, 500)
  }
  
  throw new HttpError(`Unexpected error: ${error?.message || 'An unexpected error occurred'}`, 500)
}

export interface JobAdapter {
  getJobs(): Promise<any[]>
  getJobById(id: string): Promise<any>
  getStepsForJob(jobId: string): Promise<any[]>
  createJob(data: any): Promise<any>
  updateJob(id: string, data: any): Promise<any>
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
    );
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

  async createJob(data: any) {
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

  async updateJob(id: string, data: any) {
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
