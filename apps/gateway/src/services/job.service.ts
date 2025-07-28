import { JobNotFoundError, JobService, ValidationError, DbError } from '@usersdotfun/shared-db'
import { Cause, Effect, Exit, Runtime, Scope } from 'effect'
import { AppRuntime } from '../runtime'

export class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

const handleEffectError = (error: any): never => {
  if (error instanceof JobNotFoundError) {
    throw new HttpError('Job not found', 404)
  }
  if (error instanceof ValidationError) {
    throw new HttpError('Validation failed', 400)
  }
  if (error instanceof DbError) {
    throw new HttpError('Database error', 500)
  }
  if (Cause.isRuntimeException(error)) {
    throw new HttpError('Internal server error', 500)
  }
  throw new HttpError('An unexpected error occurred', 500)
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
