import { JobNotFoundError, JobService, ValidationError, DbError } from '@usersdotfun/shared-db'
import { Cause, Effect, Exit, Runtime, Scope } from 'effect'
import { AppRuntime } from '../runtime'

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
    // Try to extract nested error properties
    nestedError: error?.error,
    errorCause: error?.cause,
    allKeys: Object.keys(error || {})
  })
  
  // Try multiple ways to extract ValidationError details
  let validationDetails = null;
  
  // Check if it's a direct ValidationError
  if (error instanceof ValidationError) {
    validationDetails = error.errors?.issues || error.errors;
  }
  // Check if it's wrapped in Effect error structure
  else if (error?.message?.includes('Validation failed')) {
    // Try to find the ValidationError in various nested properties
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
  createJob(data: any): Promise<any>
  updateJob(id: string, data: any): Promise<any>
  deleteJob(id: string): Promise<void>
  close(): Promise<void>
}

export class JobAdapterImpl implements JobAdapter {
  constructor(
    private runtime: Runtime.Runtime<any>,
    private scope: Scope.CloseableScope
  ) { }

  async getJobs() {
    return Runtime.runPromise(this.runtime)(
      Effect.gen(function* () {
        const jobService = yield* JobService
        return yield* jobService.getJobs()
      })
    )
  }

  async getJobById(id: string) {
    return Runtime.runPromise(this.runtime)(
      Effect.gen(function* () {
        const jobService = yield* JobService
        return yield* jobService.getJobById(id)
      })
    ).catch(handleEffectError)
  }

  async createJob(data: any) {
    return Runtime.runPromise(this.runtime)(
      Effect.gen(function* () {
        const jobService = yield* JobService
        return yield* jobService.createJob(data)
      })
    ).catch(handleEffectError)
  }

  async updateJob(id: string, data: any) {
    return Runtime.runPromise(this.runtime)(
      Effect.gen(function* () {
        const jobService = yield* JobService
        return yield* jobService.updateJob(id, data)
      })
    ).catch(handleEffectError)
  }

  async deleteJob(id: string) {
    return Runtime.runPromise(this.runtime)(
      Effect.gen(function* () {
        const jobService = yield* JobService
        return yield* jobService.deleteJob(id)
      })
    ).catch(handleEffectError)
  }

  async close() {
    await Effect.runPromise(Scope.close(this.scope, Exit.void))
  }
}

let jobAdapter: JobAdapter | null = null

export async function getJobAdapter(): Promise<JobAdapter> {
  if (!jobAdapter) {
    const scope = await Effect.runPromise(Scope.make())
    const runtime = await Effect.runPromise(
      Scope.extend(AppRuntime, scope)
    )
    jobAdapter = new JobAdapterImpl(runtime, scope)

    // Clean up on process exit
    process.on('SIGINT', async () => {
      if (jobAdapter) {
        await jobAdapter.close()
      }
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      if (jobAdapter) {
        await jobAdapter.close()
      }
      process.exit(0)
    })
  }
  return jobAdapter
}
