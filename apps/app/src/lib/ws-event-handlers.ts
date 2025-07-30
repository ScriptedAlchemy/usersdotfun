import { QueryClient } from '@tanstack/react-query';
import { queueOverviewSchema } from '@usersdotfun/shared-types/schemas';
import type { Job, JobRunInfo, JobWithSteps, WebSocketEvent } from '@usersdotfun/shared-types/types';
import { z } from 'zod';
import { queryKeys } from './query-keys';
import { parseQueueJobId } from './queue-utils';

type QueueOverview = z.infer<typeof queueOverviewSchema>;

type EventHandler = (client: QueryClient, data: any) => void;

export const eventHandlers: Record<WebSocketEvent['type'], EventHandler> = {
  'job:status-changed': (client, data) => {
    const { job } = data;

    // Update the list of all jobs
    client.setQueryData(queryKeys.jobs.lists(), (oldData: Job[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.map(existingJob =>
        existingJob.id === job.id ? job : existingJob
      );
    });

    // Update the specific job details
    client.setQueryData(queryKeys.jobs.detail(job.id), (oldData: JobWithSteps | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, ...job };
    });

    // Invalidate all-queue-jobs as the status mapping is complex
    client.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
  },

  'job:deleted': (client, data) => {
    const { jobId } = data;

    // Remove from the main jobs list
    client.setQueryData(queryKeys.jobs.lists(), (oldData: Job[] | undefined) =>
      oldData ? oldData.filter(job => job.id !== jobId) : []
    );

    // Invalidate and remove the specific job query
    client.removeQueries({ queryKey: queryKeys.jobs.detail(jobId) });

    // Remove from all-queue-jobs list
    client.setQueryData(queryKeys.queues.allJobs(), (oldData: any | undefined) => {
      if (!oldData || !oldData.jobs) return oldData;
      const newJobs = oldData.jobs.filter((job: any) => {
        if (!job.id) return true;
        try {
          const parsedId = parseQueueJobId(job.id);
          return parsedId.jobId !== jobId;
        } catch {
          return true; // Keep jobs that can't be parsed
        }
      });
      return {
        ...oldData,
        jobs: newJobs,
        total: newJobs.length,
      };
    });

    // Invalidate queue data as we don't have enough info to update it directly
    client.invalidateQueries({ queryKey: queryKeys.queues.all() });
  },

  'job:progress': (client, data) => {
    const { jobId } = data;

    // Update job monitoring data if it exists
    client.setQueryData(queryKeys.jobs.monitoring(jobId), (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        // Update progress in the monitoring data if needed
      };
    });

    // Invalidate all-queue-jobs to reflect progress changes
    client.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
  },

  'job:monitoring-update': (client, data) => {
    client.setQueryData(queryKeys.jobs.monitoring(data.job.id), data);
  },

  'job:run-started': (client, data) => {
    client.setQueryData(queryKeys.jobs.runs(data.jobId), (oldData: JobRunInfo[] | undefined) => {
      if (!oldData) return [data.run];
      const runExists = oldData.some(run => run.runId === data.run.runId);
      if (runExists) {
        return oldData.map(run => run.runId === data.run.runId ? data.run : run);
      } else {
        return [data.run, ...oldData];
      }
    });
    client.invalidateQueries({ queryKey: queryKeys.jobs.monitoring(data.jobId) });
    client.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
  },

  'job:run-completed': (client, data) => {
    client.setQueryData(queryKeys.jobs.runs(data.jobId), (oldData: JobRunInfo[] | undefined) => {
      if (!oldData) return [data.run];
      const runExists = oldData.some(run => run.runId === data.run.runId);
      if (runExists) {
        return oldData.map(run => run.runId === data.run.runId ? data.run : run);
      } else {
        return [data.run, ...oldData];
      }
    });
    client.invalidateQueries({ queryKey: queryKeys.jobs.monitoring(data.jobId) });
    client.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
  },

  'pipeline:step-completed': (client, data) => {
    client.invalidateQueries({ queryKey: queryKeys.jobs.monitoring(data.jobId) });
  },

  'pipeline:step-failed': (client, data) => {
    client.invalidateQueries({ queryKey: queryKeys.jobs.monitoring(data.jobId) });
  },

  'queue:status-changed': (client, data) => {
    client.setQueryData(queryKeys.queues.overview(), (oldData: { queues: Record<string, QueueOverview>; timestamp: string } | undefined) => {
      if (!oldData) return;
      return {
        ...oldData,
        queues: {
          ...oldData.queues,
          [data.queueName]: data.overview,
        },
        timestamp: new Date().toISOString(),
      };
    });
    client.invalidateQueries({ queryKey: queryKeys.queues.detail(data.queueName) });
  },

  'queue:status-update': (client, data) => {
    // This seems to be a legacy or different event, invalidation is safer
    client.invalidateQueries({ queryKey: queryKeys.queues.overview() });
    client.invalidateQueries({ queryKey: queryKeys.queues.details() });
  },

  'queue:item-added': (client, data) => {
    client.invalidateQueries({ queryKey: queryKeys.queues.overview() });
    client.invalidateQueries({ queryKey: queryKeys.queues.detail(data.queueName) });
    client.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
  },

  'queue:item-completed': (client, data) => {
    client.invalidateQueries({ queryKey: queryKeys.queues.overview() });
    client.invalidateQueries({ queryKey: queryKeys.queues.detail(data.queueName) });
    client.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
  },

  'queue:item-failed': (client, data) => {
    client.invalidateQueries({ queryKey: queryKeys.queues.overview() });
    client.invalidateQueries({ queryKey: queryKeys.queues.detail(data.queueName) });
    client.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
  },

  'queue:item-removed': (client, data) => {
    // Use a slight delay to allow optimistic updates to complete first
    setTimeout(() => {
      client.invalidateQueries({ queryKey: queryKeys.queues.all() });
      client.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
      if (data.jobId) {
        client.invalidateQueries({ queryKey: queryKeys.jobs.detail(data.jobId) });
        client.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      }
    }, 100);
  },

  'queue:paused': (client, data) => {
    client.invalidateQueries({ queryKey: queryKeys.queues.all() });
    client.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
  },

  'queue:resumed': (client, data) => {
    client.invalidateQueries({ queryKey: queryKeys.queues.all() });
    client.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
  },

  'queue:cleared': (client, data) => {
    client.invalidateQueries({ queryKey: queryKeys.queues.all() });
    client.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
  },

  'queue:job-removed': (client, data) => {
    // Delay invalidation to avoid interfering with optimistic updates
    setTimeout(() => {
      client.invalidateQueries({ queryKey: queryKeys.queues.all() });
      // Only invalidate all-queue-jobs if there's no pending optimistic update
      const hasOptimisticUpdate = client.isMutating({ mutationKey: ['removeQueueItem'] });
      if (!hasOptimisticUpdate) {
        client.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
      }
      client.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
      if (data.jobId) {
        client.invalidateQueries({ queryKey: queryKeys.jobs.detail(data.jobId) });
      }
    }, 200);
  },

  'queue:job-retried': (client, data) => {
    const retriedJob = data.job;

    // Update the job in the jobs list
    client.setQueryData(queryKeys.jobs.lists(), (oldData: Job[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.map(existingJob =>
        existingJob.id === retriedJob.id ? retriedJob : existingJob
      );
    });

    // Update the specific job details
    client.setQueryData(queryKeys.jobs.detail(retriedJob.id), (oldData: JobWithSteps | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, ...retriedJob };
    });

    client.invalidateQueries({ queryKey: queryKeys.queues.all() });
    client.invalidateQueries({ queryKey: queryKeys.queues.allJobs() });
  },
};
