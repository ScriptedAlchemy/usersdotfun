import { JobNotFoundError, JobService, ValidationError } from '@usersdotfun/shared-db'
import { Effect, Exit, Runtime, Scope } from 'effect'
import { AppRuntime } from '../runtime'

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
    ).catch(error => {
      if (error instanceof JobNotFoundError) {
        const notFoundError = new Error('Job not found')
          ; (notFoundError as any).status = 404
        throw notFoundError
      }
      throw error
    })
  }

  async createJob(data: any) {
    return Runtime.runPromise(this.runtime)(
      Effect.gen(function* () {
        const jobService = yield* JobService
        return yield* jobService.createJob(data)
      })
    ).catch(error => {
      if (error instanceof ValidationError) {
        const validationError = new Error('Validation failed')
          ; (validationError as any).status = 400
        throw validationError
      }
      throw error
    })
  }

  async updateJob(id: string, data: any) {
    return Runtime.runPromise(this.runtime)(
      Effect.gen(function* () {
        const jobService = yield* JobService
        return yield* jobService.updateJob(id, data)
      })
    ).catch(error => {
      if (error instanceof JobNotFoundError) {
        const notFoundError = new Error('Job not found')
          ; (notFoundError as any).status = 404
        throw notFoundError
      }
      if (error instanceof ValidationError) {
        const validationError = new Error('Validation failed')
          ; (validationError as any).status = 400
        throw validationError
      }
      throw error
    })
  }

  async deleteJob(id: string) {
    return Runtime.runPromise(this.runtime)(
      Effect.gen(function* () {
        const jobService = yield* JobService
        return yield* jobService.deleteJob(id)
      })
    ).catch(error => {
      if (error instanceof JobNotFoundError) {
        const notFoundError = new Error('Job not found')
          ; (notFoundError as any).status = 404
        throw notFoundError
      }
      throw error
    })
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