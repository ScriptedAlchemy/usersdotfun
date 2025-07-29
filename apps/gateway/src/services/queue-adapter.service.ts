import { QUEUE_NAMES, QueueService, QueueStatusService, type QueueName } from '@usersdotfun/shared-queue';
import type {
  JobType,
  QueueDetails,
  QueueItem,
  JobStatus,
  QueueOverview
} from '@usersdotfun/shared-types/types';
import { Effect } from 'effect';
import { AppLayer } from '../runtime';
import { toHttpError } from '../utils/error-handlers';

export interface QueueAdapter {
  getQueuesOverview(): Promise<{
    queues: Record<string, QueueOverview>;
    timestamp: string;
  }>;
  getQueueDetails(queueName: QueueName): Promise<QueueDetails>;
  getQueueItems(queueName: QueueName, status: string, page: number, limit: number): Promise<{
    items: QueueItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }>;
  getAllJobs(status?: string, limit?: number): Promise<{
    jobs: Array<QueueItem & { queueName: QueueName; status: string }>;
    total: number;
  }>;
  pauseQueue(queueName: QueueName): Promise<{ success: boolean; message: string }>;
  resumeQueue(queueName: QueueName): Promise<{ success: boolean; message: string }>;
  clearQueue(queueName: QueueName, jobType?: string): Promise<{ success: boolean; itemsRemoved: number; message: string }>;
  removeQueueJob(queueName: QueueName, jobId: string): Promise<{ success: boolean; message: string }>;
  retryQueueJob(queueName: QueueName, jobId: string): Promise<{ success: boolean; message: string }>;
}

const handleEffectError = (error: any): never => {
  throw toHttpError(error);
};

export class QueueAdapterImpl implements QueueAdapter {
  async getQueuesOverview() {
    return Effect.runPromise(
      Effect.gen(function* () {
        const queueStatusService = yield* QueueStatusService;

        const [sourceStatus, pipelineStatus] = yield* Effect.all([
          queueStatusService.getQueueStatus(QUEUE_NAMES.SOURCE_JOBS),
          queueStatusService.getQueueStatus(QUEUE_NAMES.PIPELINE_JOBS)
        ]);

        return {
          queues: {
            [sourceStatus.name]: {
              name: sourceStatus.name,
              status: sourceStatus.paused ? 'paused' as const : 'active' as const,
              waiting: sourceStatus.waiting,
              active: sourceStatus.active,
              completed: sourceStatus.completed,
              failed: sourceStatus.failed,
              delayed: sourceStatus.delayed
            },
            [pipelineStatus.name]: {
              name: pipelineStatus.name,
              status: pipelineStatus.paused ? 'paused' as const : 'active' as const,
              waiting: pipelineStatus.waiting,
              active: pipelineStatus.active,
              completed: pipelineStatus.completed,
              failed: pipelineStatus.failed,
              delayed: pipelineStatus.delayed
            }
          },
          timestamp: new Date().toISOString()
        };
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async getQueueDetails(queueName: QueueName) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const queueStatusService = yield* QueueStatusService;

        const [status, activeJobs, waitingJobs, failedJobs, delayedJobs] = yield* Effect.all([
          queueStatusService.getQueueStatus(queueName),
          queueStatusService.getActiveJobs(queueName),
          queueStatusService.getWaitingJobs(queueName),
          queueStatusService.getFailedJobs(queueName, 0, 10),
          queueStatusService.getDelayedJobs(queueName, 0, 10)
        ]);

        const mapJobToQueueItem = (job: JobStatus) => ({
          id: job.id,
          name: job.name,
          data: job.data,
          progress: job.progress,
          attemptsMade: job.attemptsMade,
          timestamp: job.timestamp,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
          delay: undefined,
          priority: 0,
          jobId: job.data?.jobId
        });

        return {
          name: status.name,
          status: status.paused ? 'paused' as const : 'active' as const,
          waiting: status.waiting,
          active: status.active,
          completed: status.completed,
          failed: status.failed,
          delayed: status.delayed,
          items: {
            active: activeJobs.map(mapJobToQueueItem),
            waiting: waitingJobs.slice(0, 10).map(mapJobToQueueItem),
            failed: failedJobs.map(mapJobToQueueItem),
            delayed: delayedJobs.map(mapJobToQueueItem)
          },
          performance: {
            processingRate: 0, // TODO: Calculate actual processing rate
            averageProcessTime: 0, // TODO: Calculate actual average process time
            errorRate: status.failed / (status.completed + status.failed + 1) // Avoid division by zero
          }
        };
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async getQueueItems(queueName: QueueName, status: string, page: number, limit: number) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const queueStatusService = yield* QueueStatusService;

        const start = (page - 1) * limit;
        const end = start + limit - 1;

        let jobs: JobStatus[];
        switch (status) {
          case 'active':
            jobs = yield* queueStatusService.getActiveJobs(queueName);
            break;
          case 'waiting':
            jobs = yield* queueStatusService.getWaitingJobs(queueName);
            break;
          case 'completed':
            jobs = yield* queueStatusService.getCompletedJobs(queueName, start, end);
            break;
          case 'failed':
            jobs = yield* queueStatusService.getFailedJobs(queueName, start, end);
            break;
          default:
            jobs = yield* queueStatusService.getWaitingJobs(queueName);
        }

        return {
          items: jobs.map(job => ({
            id: job.id,
            name: job.name,
            data: job.data,
            progress: job.progress,
            attemptsMade: job.attemptsMade,
            timestamp: job.timestamp,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
            failedReason: job.failedReason,
            status
          })),
          pagination: {
            page,
            limit,
            total: jobs.length
          }
        };
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async getAllJobs(status?: string, limit = 100) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const queueStatusService = yield* QueueStatusService;
        const queueService = yield* QueueService;
        const queueNames = [QUEUE_NAMES.SOURCE_JOBS, QUEUE_NAMES.PIPELINE_JOBS];

        let allJobs: Array<QueueItem & { queueName: QueueName; status: string; originalJobId?: string }> = [];

        for (const queueName of queueNames) {
          // Get repeatable jobs (scheduled patterns) - these are important to show!
          const repeatableJobs = yield* queueService.getRepeatableJobs(queueName);

          // Add repeatable jobs as "scheduled" status
          allJobs.push(...repeatableJobs.map(job => ({
            id: job.key, // Use the repeatable job key as ID
            name: job.name,
            data: { pattern: job.pattern, every: job.every }, // Show schedule info
            progress: 0,
            attemptsMade: 0,
            timestamp: Date.now(), // Current time for sorting
            originalJobId: job.key.includes(':') ? job.key.split(':')[1] : undefined, // Extract jobId from key if possible
            queueName,
            status: 'scheduled'
          })));

          if (!status || status === 'all') {
            // Get jobs from all statuses
            const [activeJobs, waitingJobs, completedJobs, failedJobs, delayedJobs] = yield* Effect.all([
              queueStatusService.getActiveJobs(queueName),
              queueStatusService.getWaitingJobs(queueName),
              queueStatusService.getCompletedJobs(queueName, 0, 50),
              queueStatusService.getFailedJobs(queueName, 0, 50),
              queueStatusService.getDelayedJobs(queueName, 0, 50)
            ]);

            // Helper function to map job and expose originalJobId
            const mapJob = (job: JobStatus, jobStatus: string) => ({
              id: job.id,
              name: job.name,
              data: job.data,
              progress: job.progress,
              attemptsMade: job.attemptsMade,
              timestamp: job.timestamp,
              processedOn: job.processedOn,
              finishedOn: job.finishedOn,
              failedReason: job.failedReason,
              originalJobId: job.data?.jobId, // ⭐ Expose the actual database job ID
              queueName,
              status: jobStatus
            });

            // Add active jobs
            allJobs.push(...activeJobs.map(job => mapJob(job, 'active')));

            // Add waiting jobs
            allJobs.push(...waitingJobs.map(job => mapJob(job, 'waiting')));

            // Add completed jobs
            allJobs.push(...completedJobs.map(job => mapJob(job, 'completed')));

            // Add failed jobs
            allJobs.push(...failedJobs.map(job => mapJob(job, 'failed')));

            // Add delayed jobs
            allJobs.push(...delayedJobs.map(job => mapJob(job, 'delayed')));
          } else if (status === 'scheduled') {
            // Only return repeatable jobs for scheduled status
            continue; // Already added above
          } else {
            // Get jobs from specific status
            let jobs: JobStatus[];
            switch (status) {
              case 'active':
                jobs = yield* queueStatusService.getActiveJobs(queueName);
                break;
              case 'waiting':
                jobs = yield* queueStatusService.getWaitingJobs(queueName);
                break;
              case 'completed':
                jobs = yield* queueStatusService.getCompletedJobs(queueName, 0, 50);
                break;
              case 'failed':
                jobs = yield* queueStatusService.getFailedJobs(queueName, 0, 50);
                break;
              case 'delayed':
                jobs = yield* queueStatusService.getDelayedJobs(queueName, 0, 50);
                break;
              default:
                jobs = [];
            }

            allJobs.push(...jobs.map(job => ({
              id: job.id,
              name: job.name,
              data: job.data,
              progress: job.progress,
              attemptsMade: job.attemptsMade,
              timestamp: job.timestamp,
              processedOn: job.processedOn,
              finishedOn: job.finishedOn,
              failedReason: job.failedReason,
              originalJobId: job.data?.jobId, // ⭐ Expose the actual database job ID
              queueName,
              status
            })));
          }
        }

        // Sort by timestamp (most recent first)
        allJobs.sort((a, b) => b.timestamp - a.timestamp);

        // Apply limit
        const limitedJobs = allJobs.slice(0, limit);

        return {
          jobs: limitedJobs,
          total: allJobs.length
        };
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async pauseQueue(queueName: QueueName) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const queueService = yield* QueueService;
        yield* queueService.pauseQueue(queueName);
        return {
          success: true,
          message: `Queue ${queueName} paused successfully`
        };
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch((error) => {
      console.error('Failed to pause queue:', error);
      return {
        success: false,
        message: `Failed to pause queue: ${error?.message || 'Unknown error'}`
      };
    });
  }

  async resumeQueue(queueName: QueueName) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const queueService = yield* QueueService;
        yield* queueService.resumeQueue(queueName);
        return {
          success: true,
          message: `Queue ${queueName} resumed successfully`
        };
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch((error) => {
      console.error('Failed to resume queue:', error);
      return {
        success: false,
        message: `Failed to resume queue: ${error?.message || 'Unknown error'}`
      };
    });
  }

  async clearQueue(queueName: QueueName, jobType?: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const queueService = yield* QueueService;
        const validJobType: JobType = (jobType === 'completed' || jobType === 'failed' || jobType === 'all') ? jobType as JobType : 'all';
        const result = yield* queueService.clearQueue(queueName, validJobType);
        return {
          success: true,
          itemsRemoved: result.removed,
          message: `Cleared ${result.removed} jobs from queue ${queueName}`
        };
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch((error) => {
      console.error('Failed to clear queue:', error);
      return {
        success: false,
        itemsRemoved: 0,
        message: `Failed to clear queue: ${error?.message || 'Unknown error'}`
      };
    });
  }

  async removeQueueJob(queueName: QueueName, jobId: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const queueService = yield* QueueService;
        const result = yield* queueService.removeJob(queueName, jobId);

        if (result.removed) {
          return {
            success: true,
            message: `Job ${jobId} removed successfully`
          };
        } else {
          return {
            success: false,
            message: result.reason || `Failed to remove job ${jobId}`
          };
        }
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch((error) => {
      console.error('Failed to remove job:', error);
      return {
        success: false,
        message: `Failed to remove job: ${error?.message || 'Unknown error'}`
      };
    });
  }

  async retryQueueJob(queueName: QueueName, jobId: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const queueService = yield* QueueService;
        const result = yield* queueService.retryJob(queueName, jobId);

        if (result.retried) {
          return {
            success: true,
            message: `Job ${jobId} retried successfully`
          };
        } else {
          return {
            success: false,
            message: result.reason || `Failed to retry job ${jobId}`
          };
        }
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch((error) => {
      console.error('Failed to retry job:', error);
      return {
        success: false,
        message: `Failed to retry job: ${error?.message || 'Unknown error'}`
      };
    });
  }
}

let queueAdapter: QueueAdapter | null = null;

export async function getQueueAdapter(): Promise<QueueAdapter> {
  if (!queueAdapter) {
    queueAdapter = new QueueAdapterImpl();
  }
  return queueAdapter;
}
