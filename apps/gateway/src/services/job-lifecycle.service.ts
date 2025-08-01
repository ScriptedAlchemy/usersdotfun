import { JobNotFoundError, WorkflowService } from '@usersdotfun/shared-db';
import { QUEUE_NAMES, QueueService, RedisKeys, StateService } from '@usersdotfun/shared-queue';
import type { Job, CreateWorkflow, UpdateWorkflow } from '@usersdotfun/shared-types/types';
import { Context, Effect, Layer } from 'effect';

export type CreateJobPayload = CreateWorkflow | Job;
export type UpdateJobPayload = UpdateWorkflow | Partial<Job>;

export interface JobLifecycleService {
  readonly deleteJobWithCleanup: (jobId: string) => Effect.Effect<void, JobNotFoundError | Error>;
  readonly createJobWithScheduling: (jobData: CreateJobPayload) => Effect.Effect<Job, Error>;
  readonly updateJobWithScheduling: (jobId: string, jobData: UpdateJobPayload) => Effect.Effect<Job, Error>;
  readonly cleanupOrphanedJobs: () => Effect.Effect<{ cleaned: number; errors: string[] }, Error>;
}

export const JobLifecycleService = Context.GenericTag<JobLifecycleService>('JobLifecycleService');

export const JobLifecycleServiceLive = Layer.effect(
  JobLifecycleService,
  Effect.gen(function* () {
    const jobService = yield* WorkflowService;
    const queueService = yield* QueueService;
    const stateService = yield* StateService;

    const deleteJobWithCleanup = (jobId: string) =>
      Effect.gen(function* () {
        // First verify the job exists
        const job = yield* jobService.getJobById(jobId);

        // Remove from BullMQ repeatable jobs
        const queueResult = yield* queueService.removeRepeatableJob(QUEUE_NAMES.SOURCE_JOBS, jobId);

        if (queueResult.removed) {
          yield* Effect.log(`Removed ${queueResult.count} repeatable job(s) for ${jobId} from BullMQ`);
        }

        // Clean up Redis state
        yield* stateService.delete(RedisKeys.jobState(jobId)).pipe(
          Effect.catchAll(() => Effect.void) // Ignore if state doesn't exist
        );

        // Clean up job run history
        const runIds = yield* stateService.getJobRuns(jobId).pipe(
          Effect.catchAll(() => Effect.succeed([]))
        );

        yield* Effect.forEach(
          runIds,
          (runId) => Effect.all([
            stateService.delete(RedisKeys.jobRun(jobId, runId)),
            // Clean up pipeline items for this run
            stateService.getKeys(`pipeline:${runId}:item:*`).pipe(
              Effect.flatMap((keys) =>
                Effect.forEach(keys, (key) => {
                  // Extract itemIndex from key to create proper RedisKey
                  const parts = key.split(':');
                  const itemIndex = parseInt(parts[parts.length - 1] || '0');
                  return stateService.delete(RedisKeys.pipelineItem(runId, itemIndex));
                }, { discard: true })
              )
            )
          ], { discard: true }),
          { discard: true }
        ).pipe(
          Effect.catchAll(() => Effect.void) // Ignore cleanup errors
        );

        // Clean up run history list
        yield* stateService.delete(RedisKeys.jobRunHistory(jobId)).pipe(
          Effect.catchAll(() => Effect.void)
        );

        // Clean up any error states
        yield* stateService.delete(RedisKeys.jobError(jobId)).pipe(
          Effect.catchAll(() => Effect.void)
        );

        // Finally delete from database
        yield* jobService.deleteJob(jobId);

        yield* Effect.log(`Successfully deleted job ${jobId} with full cleanup`);
      });

    const createJobWithScheduling = (jobData: CreateJobPayload) =>
      Effect.gen(function* () {
        // Auto-detect format and call appropriate service method
        const newJob = 'source' in jobData && jobData.source
          ? yield* jobService.createWorkflow(jobData as CreateWorkflow)
          : yield* jobService.createJob(jobData as Job);

        const result: Job = {
          ...newJob,
          createdAt: newJob.createdAt.toISOString(),
          updatedAt: newJob.updatedAt.toISOString(),
        }

        // Handle job scheduling based on schedule presence
        // Handle job scheduling based on schedule presence
        if (result.schedule) {
          // Job has a schedule - add as repeatable job
          const scheduleResult = yield* queueService.addRepeatableIfNotExists(
            QUEUE_NAMES.SOURCE_JOBS,
            'scheduled-source-run',
            { jobId: result.id },
            { pattern: result.schedule }
          );

          if (scheduleResult.added) {
            yield* Effect.log(`Added repeatable job for ${result.name} (${result.id})`);
          }
        } else {
          // Job has no schedule - trigger immediately
          yield* queueService.add(
            QUEUE_NAMES.SOURCE_JOBS,
            'immediate-source-run',
            { jobId: result.id },
            { delay: 1000 } // Small delay to ensure database transaction is committed
          );

          yield* Effect.log(`Added immediate job for ${result.name} (${result.id})`);
        }

        return result;
      });

    const updateJobWithScheduling = (jobId: string, jobData: UpdateJobPayload) =>
      Effect.gen(function* () {
        // Get current job to compare schedule changes
        const currentJob = yield* jobService.getJobById(jobId);

        // Update job in database
        const updatedJob = yield* jobService.updateJob(jobId, jobData);

        const result: Job = {
          ...updatedJob,
          createdAt: updatedJob.createdAt.toISOString(),
          updatedAt: updatedJob.updatedAt.toISOString(),
        }

        // Handle schedule changes
        if (jobData.schedule !== undefined && jobData.schedule !== currentJob.schedule) {
          // Remove old schedule if it exists
          yield* queueService.removeRepeatableJob(QUEUE_NAMES.SOURCE_JOBS, jobId);

          // Add new schedule if job has a schedule and is pending/scheduled
          if (result.schedule && (result.status === 'pending' || result.status === 'scheduled')) {
            const scheduleResult = yield* queueService.addRepeatableIfNotExists(
              QUEUE_NAMES.SOURCE_JOBS,
              'scheduled-source-run',
              { jobId: result.id },
              { pattern: result.schedule }
            );

            if (scheduleResult.added) {
              yield* Effect.log(`Updated schedule for job ${result.name} (${result.id})`);
            }
          } else if (!result.schedule && result.status === 'pending') {
            // Job has no schedule - trigger immediately
            yield* queueService.add(
              QUEUE_NAMES.SOURCE_JOBS,
              'immediate-source-run',
              { jobId: result.id },
              { delay: 1000 }
            );
            yield* Effect.log(`Triggered immediate execution for job ${result.name} (${result.id})`);
          }
        }

        // Handle status changes
        if ('status' in jobData && jobData.status && jobData.status !== currentJob.status) {
          if (jobData.status === 'pending') {
            if (result.schedule) {
              // Job was activated with schedule - add to repeatable queue
              const scheduleResult = yield* queueService.addRepeatableIfNotExists(
                QUEUE_NAMES.SOURCE_JOBS,
                'scheduled-source-run',
                { jobId: result.id },
                { pattern: result.schedule }
              );

              if (scheduleResult.added) {
                yield* Effect.log(`Activated scheduled job ${result.name} (${result.id})`);
              }
            } else {
              // Job was activated without schedule - trigger immediately
              yield* queueService.add(
                QUEUE_NAMES.SOURCE_JOBS,
                'immediate-source-run',
                { jobId: result.id },
                { delay: 1000 }
              );
              yield* Effect.log(`Triggered immediate job ${result.name} (${result.id})`);
            }
          } else if ((currentJob.status === 'pending' || currentJob.status === 'scheduled') && jobData.status !== 'pending') {
            // Job was deactivated - remove from queue
            const scheduleResult = yield* queueService.removeRepeatableJob(QUEUE_NAMES.SOURCE_JOBS, jobId);
            if (scheduleResult.removed) {
              yield* Effect.log(`Deactivated job ${result.name} (${result.id})`);
            }
          }
        }

        return result;
      });

    const cleanupOrphanedJobs = () =>
      Effect.gen(function* () {
        let cleaned = 0;
        const errors: string[] = [];

        // Get all repeatable jobs from BullMQ
        const repeatableJobs = yield* queueService.getRepeatableJobs(QUEUE_NAMES.SOURCE_JOBS);

        // Check each one against the database
        yield* Effect.forEach(
          repeatableJobs,
          (repeatableJob) =>
            Effect.gen(function* () {
              // Extract jobId from the key (this is a heuristic)
              const keyParts = repeatableJob.key.split(':');
              const possibleJobId = keyParts.find(part =>
                part.length === 36 && part.includes('-') // UUID format
              );

              if (!possibleJobId) {
                errors.push(`Could not extract jobId from key: ${repeatableJob.key}`);
                return;
              }

              // Check if job exists in database
              const jobExists = yield* jobService.getJobById(possibleJobId).pipe(
                Effect.map(() => true),
                Effect.catchTag('JobNotFoundError', () => Effect.succeed(false)),
                Effect.catchAll(() => Effect.succeed(false))
              );

              if (!jobExists) {
                // Remove orphaned job
                const result = yield* queueService.removeRepeatableJob(QUEUE_NAMES.SOURCE_JOBS, possibleJobId).pipe(
                  Effect.catchAll((error) => {
                    errors.push(`Failed to clean up ${possibleJobId}: ${error.message}`);
                    return Effect.succeed({ removed: false, count: 0 });
                  })
                );

                if (result.removed) {
                  cleaned += result.count;
                  yield* Effect.log(`Cleaned up orphaned job: ${possibleJobId}`);
                }
              }
            }),
          { concurrency: 5, discard: true }
        );

        return { cleaned, errors };
      });

    return {
      deleteJobWithCleanup,
      createJobWithScheduling,
      updateJobWithScheduling,
      cleanupOrphanedJobs,
    };
  })
);
