import { Effect, Runtime, Scope, Exit } from 'effect';
import { JobMonitoringService, type JobMonitoringData, type JobRunInfo } from './job-monitoring.service';
import { HttpError, getJobAdapter } from './job.service';

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
  close(): Promise<void>;
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
  constructor(
    private runtime: Runtime.Runtime<any>,
    private scope: Scope.CloseableScope
  ) {}

  async getJobMonitoringData(jobId: string) {
    return Runtime.runPromise(this.runtime)(
      Effect.gen(function* () {
        const jobMonitoringService = yield* JobMonitoringService;
        return yield* jobMonitoringService.getJobMonitoringData(jobId);
      })
    ).catch(handleEffectError);
  }

  async getJobStatus(jobId: string) {
    return Runtime.runPromise(this.runtime)(
      Effect.gen(function* () {
        const jobMonitoringService = yield* JobMonitoringService;
        return yield* jobMonitoringService.getJobStatus(jobId);
      })
    ).catch(handleEffectError);
  }

  async getJobRuns(jobId: string) {
    return Runtime.runPromise(this.runtime)(
      Effect.gen(function* () {
        const jobMonitoringService = yield* JobMonitoringService;
        return yield* jobMonitoringService.getJobRuns(jobId);
      })
    ).catch(handleEffectError);
  }

  async getJobRunDetails(jobId: string, runId: string) {
    return Runtime.runPromise(this.runtime)(
      Effect.gen(function* () {
        const jobMonitoringService = yield* JobMonitoringService;
        return yield* jobMonitoringService.getJobRunDetails(jobId, runId);
      })
    ).catch(handleEffectError);
  }

  async close() {
    await Effect.runPromise(Scope.close(this.scope, Exit.void));
  }
}

let jobMonitoringAdapter: JobMonitoringAdapter | null = null;

export async function getJobMonitoringAdapter(): Promise<JobMonitoringAdapter> {
  if (!jobMonitoringAdapter) {
    const jobAdapter = await getJobAdapter();
    const adapterImpl = jobAdapter as any;
    
    jobMonitoringAdapter = new JobMonitoringAdapterImpl(
      adapterImpl.runtime,
      adapterImpl.scope
    );
  }
  return jobMonitoringAdapter;
}
