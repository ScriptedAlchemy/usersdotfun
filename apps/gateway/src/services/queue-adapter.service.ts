import { Effect } from 'effect';
import { QueueStatusService, QueueService, type QueueStatus, type JobStatus } from '@usersdotfun/shared-queue';
import { HttpError } from './job.service';
import { AppLayer } from '../runtime';

export interface QueueOverview {
  name: string;
  status: 'active' | 'paused';
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface QueueDetails {
  name: string;
  status: 'active' | 'paused';
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  jobs: {
    active: Array<{
      id: string;
      name: string;
      progress: number;
      attemptsMade: number;
      processedOn?: number;
    }>;
    waiting: Array<{
      id: string;
      name: string;
      timestamp: number;
    }>;
    failed: Array<{
      id: string;
      name: string;
      failedReason?: string;
      attemptsMade: number;
      finishedOn?: number;
    }>;
  };
}

export interface QueueItem {
  id: string;
  name: string;
  data: any;
  progress: number;
  attemptsMade: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  status: string;
}

export interface QueueAdapter {
  getQueuesOverview(): Promise<{
    queues: Record<string, QueueOverview>;
    timestamp: string;
  }>;
  getQueueDetails(queueName: string): Promise<QueueDetails>;
  getQueueItems(queueName: string, status: string, page: number, limit: number): Promise<{
    items: QueueItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }>;
  getAllJobs(status?: string, limit?: number): Promise<{
    jobs: Array<QueueItem & { queueName: string; status: string }>;
    total: number;
  }>;
  pauseQueue(queueName: string): Promise<{ success: boolean; message: string }>;
  resumeQueue(queueName: string): Promise<{ success: boolean; message: string }>;
  clearQueue(queueName: string, jobType?: string): Promise<{ success: boolean; itemsRemoved: number; message: string }>;
  removeQueueJob(queueName: string, jobId: string): Promise<{ success: boolean; message: string }>;
  retryQueueJob(queueName: string, jobId: string): Promise<{ success: boolean; message: string }>;
}

const handleEffectError = (error: any): never => {
  console.error('Queue Effect Error:', {
    error,
    message: error?.message,
    cause: error?.cause,
    stack: error?.stack,
  });
  
  throw new HttpError(`Queue error: ${error?.message || 'An unexpected error occurred'}`, 500);
};

export class QueueAdapterImpl implements QueueAdapter {
  async getQueuesOverview() {
    return Effect.runPromise(
      Effect.gen(function* () {
        const queueStatusService = yield* QueueStatusService;
        
        const [sourceStatus, pipelineStatus] = yield* Effect.all([
          queueStatusService.getQueueStatus('source-jobs'),
          queueStatusService.getQueueStatus('pipeline-jobs')
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

  async getQueueDetails(queueName: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const queueStatusService = yield* QueueStatusService;
        
        const [status, activeJobs, waitingJobs, failedJobs] = yield* Effect.all([
          queueStatusService.getQueueStatus(queueName),
          queueStatusService.getActiveJobs(queueName),
          queueStatusService.getWaitingJobs(queueName),
          queueStatusService.getFailedJobs(queueName, 0, 10) // Get last 10 failed jobs
        ]);

        return {
          name: status.name,
          status: status.paused ? 'paused' as const : 'active' as const,
          counts: {
            waiting: status.waiting,
            active: status.active,
            completed: status.completed,
            failed: status.failed,
            delayed: status.delayed
          },
          jobs: {
            active: activeJobs.map(job => ({
              id: job.id,
              name: job.name,
              progress: job.progress,
              attemptsMade: job.attemptsMade,
              processedOn: job.processedOn
            })),
            waiting: waitingJobs.slice(0, 10).map(job => ({
              id: job.id,
              name: job.name,
              timestamp: job.timestamp
            })),
            failed: failedJobs.map(job => ({
              id: job.id,
              name: job.name,
              failedReason: job.failedReason,
              attemptsMade: job.attemptsMade,
              finishedOn: job.finishedOn
            }))
          }
        };
      }).pipe(
        Effect.provide(AppLayer),
        Effect.scoped
      )
    ).catch(handleEffectError);
  }

  async getQueueItems(queueName: string, status: string, page: number, limit: number) {
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
        const queueNames = ['source-jobs', 'pipeline-jobs'];
        
        let allJobs: Array<QueueItem & { queueName: string; status: string }> = [];
        
        for (const queueName of queueNames) {
          if (!status || status === 'all') {
            // Get jobs from all statuses
            const [activeJobs, waitingJobs, completedJobs, failedJobs] = yield* Effect.all([
              queueStatusService.getActiveJobs(queueName),
              queueStatusService.getWaitingJobs(queueName),
              queueStatusService.getCompletedJobs(queueName, 0, 50),
              queueStatusService.getFailedJobs(queueName, 0, 50)
            ]);

            // Add active jobs
            allJobs.push(...activeJobs.map(job => ({
              id: job.id,
              name: job.name,
              data: job.data,
              progress: job.progress,
              attemptsMade: job.attemptsMade,
              timestamp: job.timestamp,
              processedOn: job.processedOn,
              finishedOn: job.finishedOn,
              failedReason: job.failedReason,
              queueName,
              status: 'active'
            })));

            // Add waiting jobs
            allJobs.push(...waitingJobs.map(job => ({
              id: job.id,
              name: job.name,
              data: job.data,
              progress: job.progress,
              attemptsMade: job.attemptsMade,
              timestamp: job.timestamp,
              processedOn: job.processedOn,
              finishedOn: job.finishedOn,
              failedReason: job.failedReason,
              queueName,
              status: 'waiting'
            })));

            // Add completed jobs
            allJobs.push(...completedJobs.map(job => ({
              id: job.id,
              name: job.name,
              data: job.data,
              progress: job.progress,
              attemptsMade: job.attemptsMade,
              timestamp: job.timestamp,
              processedOn: job.processedOn,
              finishedOn: job.finishedOn,
              failedReason: job.failedReason,
              queueName,
              status: 'completed'
            })));

            // Add failed jobs
            allJobs.push(...failedJobs.map(job => ({
              id: job.id,
              name: job.name,
              data: job.data,
              progress: job.progress,
              attemptsMade: job.attemptsMade,
              timestamp: job.timestamp,
              processedOn: job.processedOn,
              finishedOn: job.finishedOn,
              failedReason: job.failedReason,
              queueName,
              status: 'failed'
            })));
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

  async pauseQueue(queueName: string) {
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

  async resumeQueue(queueName: string) {
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

  async clearQueue(queueName: string, jobType?: string) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const queueService = yield* QueueService;
        const validJobType = jobType === 'completed' || jobType === 'failed' || jobType === 'all' ? jobType : 'all';
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

  async removeQueueJob(queueName: string, jobId: string) {
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

  async retryQueueJob(queueName: string, jobId: string) {
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
