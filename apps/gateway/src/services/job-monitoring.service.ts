import { JobService } from '@usersdotfun/shared-db';
import { QueueStatusService, StateService, RedisKeys } from '@usersdotfun/shared-queue';
import type { JobMonitoringData, JobRunInfo, PipelineStep, JobStatusSummary, JobRunDetails } from '@usersdotfun/shared-types/types';
import { QUEUE_NAMES } from '@usersdotfun/shared-queue';
import { Context, Effect, Layer, Option } from 'effect';

export interface JobMonitoringService {
  readonly getJobMonitoringData: (jobId: string) => Effect.Effect<JobMonitoringData, Error>;
  readonly getJobStatus: (jobId: string) => Effect.Effect<JobStatusSummary, Error>;
  readonly getJobRuns: (jobId: string) => Effect.Effect<JobRunInfo[], Error>;
  readonly getJobRunDetails: (jobId: string, runId: string) => Effect.Effect<JobRunDetails, Error>;
}

export const JobMonitoringService = Context.GenericTag<JobMonitoringService>('JobMonitoringService');

export const JobMonitoringServiceLive = Layer.effect(
  JobMonitoringService,
  Effect.gen(function* () {
    const jobService = yield* JobService;
    const stateService = yield* StateService;
    const queueStatusService = yield* QueueStatusService;

    const parseJobRunsHistory = (jobId: string, runIds: string[]): Effect.Effect<JobRunInfo[], Error> =>
      Effect.gen(function* () {
        const runs = yield* Effect.all(
          runIds.map(runId =>
            Effect.gen(function* () {
              const runData = yield* stateService.getJobRun(jobId, runId);
              if (Option.isSome(runData)) {
                const data = runData.value;
                return {
                  runId,
                  status: data.status || 'unknown',
                  startedAt: data.startedAt ? data.startedAt : new Date().toISOString(),
                  completedAt: data.completedAt ? data.completedAt : undefined,
                  itemsProcessed: data.itemsProcessed || 0,
                  itemsTotal: data.itemsTotal || 0,
                  state: data.nextState,
                };
              }
              // Fallback parsing for old format
              try {
                const parts = runId.split(':');
                const timestamp = parts[1];
                return {
                  runId,
                  status: 'unknown',
                  startedAt: timestamp ? new Date(parseInt(timestamp)).toISOString() : new Date().toISOString(),
                  itemsProcessed: 0,
                  itemsTotal: 0,
                };
              } catch {
                return {
                  runId,
                  status: 'unknown',
                  startedAt: new Date().toISOString(),
                  itemsProcessed: 0,
                  itemsTotal: 0,
                };
              }
            }).pipe(Effect.catchAll(() => Effect.succeed({
              runId,
              status: 'unknown',
              startedAt: new Date().toISOString(),
              itemsProcessed: 0,
              itemsTotal: 0,
            })))
          )
        );
        return runs;
      }).pipe(Effect.catchAll(() => Effect.succeed([])));

    const getPipelineStepsFromRedis = (jobId: string): Effect.Effect<PipelineStep[], Error> =>
      Effect.gen(function* () {
        // Get all pipeline item keys for this job
        const keys = yield* stateService.getKeys(`pipeline:*:item:*`);
        const jobKeys = keys.filter((key: string) => {
          const parts = key.split(':');
          return parts.length >= 4; // pipeline:runId:item:itemIndex
        });

        const pipelineItems = yield* Effect.all(
          jobKeys.map((key: string) =>
            Effect.gen(function* () {
              const parts = key.split(':');
              const runId = parts[1] || '';
              const itemIndex = parseInt(parts[3] || '0');

              const itemData = yield* stateService.getPipelineItem(runId, itemIndex);
              if (Option.isSome(itemData)) {
                const data = itemData.value;
                // Only include items for this job
                if (data.sourceJobId === jobId) {
                  return Option.some({
                    id: `${runId}-${itemIndex}`,
                    jobId: data.sourceJobId,
                    stepId: data.stepId || `step-${itemIndex}`,
                    pluginName: data.pluginName || 'unknown',
                    config: data.config || {},
                    input: data.item,
                    output: data.result,
                    error: data.error,
                    status: data.status || 'unknown',
                    startedAt: data.startedAt ? data.startedAt : null,
                    completedAt: data.completedAt ? data.completedAt : null,
                  } as PipelineStep);
                }
              }
              return Option.none();
            }).pipe(Effect.catchAll(() => Effect.succeed(Option.none())))
          )
        );

        return pipelineItems
          .filter(Option.isSome)
          .map((item) => (item as Option.Some<PipelineStep>).value)
          .sort((a, b) => {
            const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
            const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
            return aTime - bTime;
          });
      }).pipe(Effect.catchAll(() => Effect.succeed([])));

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
            recentRunIds
          ] = yield* Effect.all([
            jobService.getJobById(jobId),
            stateService.get(RedisKeys.jobState(jobId)),
            queueStatusService.getQueueStatus(QUEUE_NAMES.SOURCE_JOBS),
            queueStatusService.getQueueStatus(QUEUE_NAMES.PIPELINE_JOBS),
            queueStatusService.getActiveJobs(QUEUE_NAMES.SOURCE_JOBS),
            queueStatusService.getActiveJobs(QUEUE_NAMES.PIPELINE_JOBS),
            stateService.getJobRuns(jobId),
          ]);

          const [recentRuns, pipelineSteps] = yield* Effect.all([
            parseJobRunsHistory(jobId, recentRunIds),
            getPipelineStepsFromRedis(jobId),
          ]);

          const jobActiveSourceJobs = activeSourceJobs.filter(j =>
            j.data?.jobId === jobId
          );
          const jobActivePipelineJobs = activePipelineJobs.filter(j =>
            j.data?.jobId === jobId || j.data?.sourceJobId === jobId
          );

          return {
            job: {
              ...job,
              createdAt: job.createdAt.toISOString(),
              updatedAt: job.updatedAt.toISOString(),
            },
            currentState: Option.isSome(currentState) ? currentState.value : undefined,
            queueStatus: {
              sourceQueue: sourceQueueStatus,
              pipelineQueue: pipelineQueueStatus,
            },
            activeJobs: {
              sourceJobs: jobActiveSourceJobs,
              pipelineJobs: jobActivePipelineJobs,
            },
            recentRuns,
            pipelineSteps,
          };
        }),

      getJobStatus: (jobId) =>
        Effect.gen(function* () {
          const [job, activeSourceJobs, waitingSourceJobs] = yield* Effect.all([
            jobService.getJobById(jobId),
            queueStatusService.getActiveJobs(QUEUE_NAMES.SOURCE_JOBS),
            queueStatusService.getWaitingJobs(QUEUE_NAMES.SOURCE_JOBS),
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
                startedAt: new Date(activeJob.processedOn || activeJob.timestamp).toISOString(),
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
          return yield* parseJobRunsHistory(jobId, runIds);
        }),

      getJobRunDetails: (jobId, runId) =>
        Effect.gen(function* () {
          const [runState, keys] = yield* Effect.all([
            stateService.getJobRun(jobId, runId),
            stateService.getKeys(`pipeline:${runId}:item:*`),
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
            startedAt: new Date().toISOString(),
            itemsProcessed: filteredItems.length,
            itemsTotal: filteredItems.length,
            state: Option.isSome(runState) ? runState.value : undefined,
          };

          return {
            run,
            pipelineItems: filteredItems as PipelineStep[],
          };
        }),
    };
  })
);
