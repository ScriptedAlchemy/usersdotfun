import { JobService, JobNotFoundError } from '@usersdotfun/shared-db';
import { QueueService, StateService } from '@usersdotfun/shared-queue';
import { Context, Effect, Layer } from 'effect';
import { QUEUE_NAMES } from '@usersdotfun/shared-queue';

export interface JobLifecycleService {
  readonly deleteJobWithCleanup: (jobId: string) => Effect.Effect<void, JobNotFoundError | Error>;
  readonly createJobWithScheduling: (jobData: any) => Effect.Effect<any, Error>;
  readonly updateJobWithScheduling: (jobId: string, jobData: any) => Effect.Effect<any, Error>;
  readonly cleanupOrphanedJobs: () => Effect.Effect<{ cleaned: number; errors: string[] }, Error>;
}

export const JobLifecycleService = Context.GenericTag<JobLifecycleService>('JobLifecycleService');

export const JobLifecycleServiceLive = Layer.effect(
  JobLifecycleService,
  Effect.gen(function* () {
    const jobService = yield* JobService;
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
        yield* stateService.delete(jobId).pipe(
          Effect.catchAll(() => Effect.void) // Ignore if state doesn't exist
        );
        
        // Clean up job run history
        const runIds = yield* stateService.getJobRuns(jobId).pipe(
          Effect.catchAll(() => Effect.succeed([]))
        );
        
        yield* Effect.forEach(
          runIds,
          (runId) => Effect.all([
            stateService.delete(`job-run:${jobId}:${runId}`),
            // Clean up pipeline items for this run
            stateService.getKeys(`pipeline-item:${runId}:*`).pipe(
              Effect.flatMap((keys) =>
                Effect.forEach(keys, (key) => stateService.delete(key), { discard: true })
              )
            )
          ], { discard: true }),
          { discard: true }
        ).pipe(
          Effect.catchAll(() => Effect.void) // Ignore cleanup errors
        );
        
        // Clean up run history list
        yield* stateService.delete(`job-runs:${jobId}:history`).pipe(
          Effect.catchAll(() => Effect.void)
        );
        
        // Clean up any error states
        yield* stateService.delete(`job-error:${jobId}`).pipe(
          Effect.catchAll(() => Effect.void)
        );
        
        // Finally delete from database
        yield* jobService.deleteJob(jobId);
        
        yield* Effect.log(`Successfully deleted job ${jobId} with full cleanup`);
      });

    const createJobWithScheduling = (jobData: any) =>
      Effect.gen(function* () {
        // Auto-detect format and call appropriate service method
        const newJob = jobData.source 
          ? yield* jobService.createJobDefinition(jobData)  // JobDefinition format
          : yield* jobService.createJob(jobData);           // Flattened format
        
        // Handle job scheduling based on schedule presence
        if (newJob.schedule) {
          // Job has a schedule - add as repeatable job
          const result = yield* queueService.addRepeatableIfNotExists(
            QUEUE_NAMES.SOURCE_JOBS,
            'scheduled-source-run',
            { jobId: newJob.id },
            { pattern: newJob.schedule }
          );
          
          if (result.added) {
            yield* Effect.log(`Added repeatable job for ${newJob.name} (${newJob.id})`);
          }
        } else {
          // Job has no schedule - trigger immediately
          yield* queueService.add(
            QUEUE_NAMES.SOURCE_JOBS,
            'immediate-source-run',
            { jobId: newJob.id },
            { delay: 1000 } // Small delay to ensure database transaction is committed
          );
          
          yield* Effect.log(`Added immediate job for ${newJob.name} (${newJob.id})`);
        }
        
        return newJob;
      });

    const updateJobWithScheduling = (jobId: string, jobData: any) =>
      Effect.gen(function* () {
        // Get current job to compare schedule changes
        const currentJob = yield* jobService.getJobById(jobId);
        
        // Update job in database
        const updatedJob = yield* jobService.updateJob(jobId, jobData);
        
        // Handle schedule changes
        if (jobData.schedule !== undefined && jobData.schedule !== currentJob.schedule) {
          // Remove old schedule if it exists
          yield* queueService.removeRepeatableJob(QUEUE_NAMES.SOURCE_JOBS, jobId);
          
          // Add new schedule if job has a schedule and is pending/scheduled
          if (updatedJob.schedule && (updatedJob.status === 'pending' || updatedJob.status === 'scheduled')) {
            const result = yield* queueService.addRepeatableIfNotExists(
              QUEUE_NAMES.SOURCE_JOBS,
              'scheduled-source-run',
              { jobId: updatedJob.id },
              { pattern: updatedJob.schedule }
            );
            
            if (result.added) {
              yield* Effect.log(`Updated schedule for job ${updatedJob.name} (${updatedJob.id})`);
            }
          } else if (!updatedJob.schedule && updatedJob.status === 'pending') {
            // Job has no schedule - trigger immediately
            yield* queueService.add(
              QUEUE_NAMES.SOURCE_JOBS,
              'immediate-source-run',
              { jobId: updatedJob.id },
              { delay: 1000 }
            );
            yield* Effect.log(`Triggered immediate execution for job ${updatedJob.name} (${updatedJob.id})`);
          }
        }
        
        // Handle status changes
        if (jobData.status && jobData.status !== currentJob.status) {
          if (jobData.status === 'pending') {
            if (updatedJob.schedule) {
              // Job was activated with schedule - add to repeatable queue
              const result = yield* queueService.addRepeatableIfNotExists(
                QUEUE_NAMES.SOURCE_JOBS,
                'scheduled-source-run',
                { jobId: updatedJob.id },
                { pattern: updatedJob.schedule }
              );
              
              if (result.added) {
                yield* Effect.log(`Activated scheduled job ${updatedJob.name} (${updatedJob.id})`);
              }
            } else {
              // Job was activated without schedule - trigger immediately
              yield* queueService.add(
                QUEUE_NAMES.SOURCE_JOBS,
                'immediate-source-run',
                { jobId: updatedJob.id },
                { delay: 1000 }
              );
              yield* Effect.log(`Triggered immediate job ${updatedJob.name} (${updatedJob.id})`);
            }
          } else if ((currentJob.status === 'pending' || currentJob.status === 'scheduled') && jobData.status !== 'pending') {
            // Job was deactivated - remove from queue
            const result = yield* queueService.removeRepeatableJob(QUEUE_NAMES.SOURCE_JOBS, jobId);
            if (result.removed) {
              yield* Effect.log(`Deactivated job ${updatedJob.name} (${updatedJob.id})`);
            }
          }
        }
        
        return updatedJob;
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
