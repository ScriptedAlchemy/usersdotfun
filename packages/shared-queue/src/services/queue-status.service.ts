import { QUEUE_NAMES, type JobStatus, type JobStatusType, type QueueName, type QueueStatus } from '@usersdotfun/shared-types/types';
import { Job, Queue } from 'bullmq';
import { Context, Effect, Layer } from 'effect';
import { RedisConfig } from './redis-config.service';

export interface QueueStatusService {
  readonly getQueuesStatus: () => Effect.Effect<QueueStatus[], Error>;
  readonly getQueueStatus: (queueName: QueueName) => Effect.Effect<QueueStatus, Error>;
  readonly getActiveJobs: (queueName: QueueName) => Effect.Effect<JobStatus[], Error>;
  readonly getWaitingJobs: (queueName: QueueName) => Effect.Effect<JobStatus[], Error>;
  readonly getCompletedJobs: (queueName: QueueName, start?: number, end?: number) => Effect.Effect<JobStatus[], Error>;
  readonly getFailedJobs: (queueName: QueueName, start?: number, end?: number) => Effect.Effect<JobStatus[], Error>;
  readonly getDelayedJobs: (queueName: QueueName, start?: number, end?: number) => Effect.Effect<JobStatus[], Error>;
  readonly getJobById: (queueName: QueueName, jobId: string) => Effect.Effect<JobStatus | null, Error>;
  readonly getAllJobs: (filters?: {
    status?: string;
    queueName?: string;
    limit?: number;
    offset?: number;
  }) => Effect.Effect<{ items: JobStatus[]; total: number }, Error>;
}

export const QueueStatusService = Context.GenericTag<QueueStatusService>('QueueStatusService');

const mapBullJobToJobStatus = (job: Job, queueName: QueueName): JobStatus => ({
  id: job.id!,
  name: job.name,
  data: job.data,
  progress: job.progress || 0,
  attemptsMade: job.attemptsMade || 0,
  timestamp: job.timestamp,
  processedOn: job.processedOn,
  finishedOn: job.finishedOn,
  failedReason: job.failedReason,
  returnvalue: job.returnvalue,
  queueName: queueName,
});

export const QueueStatusServiceLive = Layer.scoped(
  QueueStatusService,
  Effect.gen(function* () {
    const redisConfig = yield* RedisConfig;

    const connectionConfig = {
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      username: redisConfig.username,
      db: redisConfig.db,
    };

    const queueEntries = yield* Effect.all(
      Object.values(QUEUE_NAMES).map((name) =>
        Effect.acquireRelease(
          Effect.sync(
            () =>
              new Queue(name, {
                connection: connectionConfig,
              })
          ),
          (q) => Effect.promise(() => q.close())
        ).pipe(Effect.map((queue) => [name, queue] as const))
      )
    );

    const queues = new Map<string, Queue>(queueEntries);

    const getQueue = (name: string): Effect.Effect<Queue, Error> => {
      const queue = queues.get(name);
      return queue
        ? Effect.succeed(queue)
        : Effect.fail(new Error(`Queue ${name} not found`));
    };

    const getJobsByStatus = (queueName: QueueName, status: JobStatusType, start = 0, end = 49) =>
      Effect.flatMap(getQueue(queueName), (queue) =>
        Effect.tryPromise({
          try: async () => {
            const jobs = await queue.getJobs([status], start, end);
            return jobs.map(job => mapBullJobToJobStatus(job, queueName));
          },
          catch: (error) => new Error(`Failed to get ${status} jobs for ${queueName}: ${error}`),
        })
      );


    const getQueueStatus = (queueName: QueueName) =>
      Effect.flatMap(getQueue(queueName), (queue) =>
        Effect.tryPromise({
          try: async () => {
            const counts = await queue.getJobCounts('active', 'waiting', 'completed', 'failed', 'delayed');
            const isPaused = await queue.isPaused();
            return {
              name: queueName,
              waiting: counts.waiting ?? 0,
              active: counts.active ?? 0,
              completed: counts.completed ?? 0,
              failed: counts.failed ?? 0,
              delayed: counts.delayed ?? 0,
              paused: isPaused,
            };
          },
          catch: (error) => new Error(`Failed to get queue status for ${queueName}: ${error}`),
        })
      );

    return {
      getQueuesStatus: () =>
        Effect.all(
          Object.values(QUEUE_NAMES).map((name) => getQueueStatus(name as QueueName))
        ),
      getQueueStatus,
      getActiveJobs: (queueName) => getJobsByStatus(queueName, 'active'),
      getWaitingJobs: (queueName) => getJobsByStatus(queueName, 'waiting'),
      getCompletedJobs: (queueName, start, end) => getJobsByStatus(queueName, 'completed', start, end),
      getFailedJobs: (queueName, start, end) => getJobsByStatus(queueName, 'failed', start, end),
      getDelayedJobs: (queueName, start, end) => getJobsByStatus(queueName, 'delayed', start, end),

      getJobById: (queueName, jobId) =>
        Effect.flatMap(getQueue(queueName), (queue) =>
          Effect.tryPromise({
            try: async () => {
              const job = await queue.getJob(jobId);
              return job ? mapBullJobToJobStatus(job, queueName) : null;
            },
            catch: (error) => new Error(`Failed to get job ${jobId} from ${queueName}: ${error}`),
          })
        ),

      getAllJobs: (filters = {}) =>
        Effect.gen(function* () {
          const { status, queueName, limit = 50, offset = 0 } = filters;

          const queuesToQuery = queueName
            ? [yield* getQueue(queueName)]
            : Array.from(queues.values());

          let allJobs: JobStatus[] = [];

          const jobTypes: JobStatusType[] = status ? [status as JobStatusType] : ['active', 'waiting', 'completed', 'failed', 'delayed'];

          for (const queue of queuesToQuery) {
            const jobsForQueue = yield* Effect.tryPromise({
              try: () => queue.getJobs(jobTypes, offset, offset + limit - 1),
              catch: (e) => new Error(`Failed to get jobs from ${queue.name}: ${e}`),
            });

            const flattenedJobs = jobsForQueue.flat().map(job => mapBullJobToJobStatus(job, queue.name as QueueName));
            allJobs.push(...flattenedJobs);
          }

          // Sort by timestamp (most recent first)
          allJobs.sort((a, b) => b.timestamp - a.timestamp);

          // Apply pagination
          const paginatedJobs = allJobs.slice(offset, offset + limit);

          return {
            items: paginatedJobs,
            total: allJobs.length,
          };
        }),
    };
  })
);
