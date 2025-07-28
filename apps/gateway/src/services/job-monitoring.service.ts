import { JobService } from '@usersdotfun/shared-db';
import { Context, Effect, Layer, Option } from 'effect';
import { QueueStatusService, type JobStatus, type QueueStatus } from './queue-status.service';
import { StateService } from './state.service';

export interface JobRunInfo {
  readonly runId: string;
  readonly status: string;
  readonly startedAt: Date;
  readonly completedAt?: Date;
  readonly itemsProcessed: number;
  readonly itemsTotal: number;
  readonly state?: unknown;
}

export interface JobMonitoringData {
  readonly job: any;
  readonly currentState?: unknown;
  readonly queueStatus: {
    readonly sourceQueue: QueueStatus;
    readonly pipelineQueue: QueueStatus;
  };
  readonly activeJobs: {
    readonly sourceJobs: JobStatus[];
    readonly pipelineJobs: JobStatus[];
  };
  readonly recentRuns: JobRunInfo[];
  readonly pipelineSteps: any[];
}

export interface JobMonitoringService {
  readonly getJobMonitoringData: (jobId: string) => Effect.Effect<JobMonitoringData, Error>;
  readonly getJobStatus: (jobId: string) => Effect.Effect<{
    status: string;
    queuePosition?: number;
    estimatedStartTime?: Date;
    currentRun?: JobRunInfo;
  }, Error>;
  readonly getJobRuns: (jobId: string) => Effect.Effect<JobRunInfo[], Error>;
  readonly getJobRunDetails: (jobId: string, runId: string) => Effect.Effect<{
    run: JobRunInfo;
    pipelineItems: any[];
  }, Error>;
}

export const JobMonitoringService = Context.GenericTag<JobMonitoringService>('JobMonitoringService');

export const JobMonitoringServiceLive = Layer.effect(
  JobMonitoringService,
  Effect.gen(function* () {
    const jobService = yield* JobService;
    const stateService = yield* StateService;
    const queueStatusService = yield* QueueStatusService;

    const parseJobRunsHistory = (runIds: string[]): JobRunInfo[] => {
      return runIds.map(runId => {
        try {
          const parts = runId.split(':');
          const timestamp = parts[2];
          const status = parts[3];
          return {
            runId,
            status: status || 'unknown',
            startedAt: timestamp ? new Date(parseInt(timestamp) * 1000) : new Date(),
            itemsProcessed: 0,
            itemsTotal: 0,
          };
        } catch {
          return {
            runId,
            status: 'unknown',
            startedAt: new Date(),
            itemsProcessed: 0,
            itemsTotal: 0,
          };
        }
      });
    };

    return {
      getJobMonitoringData: (jobId) =>
        Effect.gen(function* () {
          const [
            job,
            currentState,
            sourceQueueStatus,
            pipelineQueueStatus,
            activeSourceJobs,
            activePipelineJobs,
            recentRunIds,
            pipelineSteps
          ] = yield* Effect.all([
            jobService.getJobById(jobId),
            stateService.get(jobId),
            queueStatusService.getQueueStatus('source-jobs'),
            queueStatusService.getQueueStatus('pipeline-jobs'),
            queueStatusService.getActiveJobs('source-jobs'),
            queueStatusService.getActiveJobs('pipeline-jobs'),
            stateService.getJobRuns(jobId),
            jobService.getStepsForJob(jobId),
          ]);

          const jobActiveSourceJobs = activeSourceJobs.filter(j => 
            j.data?.jobId === jobId
          );
          const jobActivePipelineJobs = activePipelineJobs.filter(j => 
            j.data?.jobDefinition?.id === jobId
          );

          return {
            job,
            currentState: Option.isSome(currentState) ? currentState.value : undefined,
            queueStatus: {
              sourceQueue: sourceQueueStatus,
              pipelineQueue: pipelineQueueStatus,
            },
            activeJobs: {
              sourceJobs: jobActiveSourceJobs,
              pipelineJobs: jobActivePipelineJobs,
            },
            recentRuns: parseJobRunsHistory(recentRunIds),
            pipelineSteps,
          };
        }),

      getJobStatus: (jobId) =>
        Effect.gen(function* () {
          const [job, activeSourceJobs, waitingSourceJobs] = yield* Effect.all([
            jobService.getJobById(jobId),
            queueStatusService.getActiveJobs('source-jobs'),
            queueStatusService.getWaitingJobs('source-jobs'),
          ]);

          const jobActiveJobs = activeSourceJobs.filter(j => j.data?.jobId === jobId);
          const jobWaitingJobs = waitingSourceJobs.filter(j => j.data?.jobId === jobId);

          if (jobActiveJobs.length > 0) {
            const activeJob = jobActiveJobs[0]!;
            return {
              status: 'running',
              currentRun: {
                runId: activeJob.id,
                status: 'running',
                startedAt: new Date(activeJob.processedOn || activeJob.timestamp),
                itemsProcessed: activeJob.progress,
                itemsTotal: 0,
              },
            };
          }

          if (jobWaitingJobs.length > 0) {
            const position = waitingSourceJobs.findIndex(j => j.data?.jobId === jobId);
            return {
              status: 'queued',
              queuePosition: position + 1,
            };
          }

          return {
            status: job.status,
          };
        }),

      getJobRuns: (jobId) =>
        Effect.gen(function* () {
          const runIds = yield* stateService.getJobRuns(jobId);
          return parseJobRunsHistory(runIds);
        }),

      getJobRunDetails: (jobId, runId) =>
        Effect.gen(function* () {
          const [runState, keys] = yield* Effect.all([
            stateService.getJobRun(jobId, runId),
            stateService.getKeys(`pipeline-item:${runId}:*`),
          ]);

          const pipelineItems = yield* Effect.all(
            keys.map(key => {
              const itemIndex = parseInt(key.split(':').pop() || '0');
              return stateService.getPipelineItem(runId, itemIndex);
            })
          );

          const filteredItems = pipelineItems
            .filter(Option.isSome)
            .map(item => item.value);

          const run: JobRunInfo = {
            runId,
            status: 'completed',
            startedAt: new Date(),
            itemsProcessed: filteredItems.length,
            itemsTotal: filteredItems.length,
            state: Option.isSome(runState) ? runState.value : undefined,
          };

          return {
            run,
            pipelineItems: filteredItems,
          };
        }),
    };
  })
);
