import { QueryClient } from '@tanstack/react-query';
import { JobStatus, WebSocketEvent } from '@usersdotfun/shared-types/types';
import { queryKeys } from './queries';

type QueryUpdater<T> = (oldData: T | undefined) => T | undefined;

const updateQueryData = <T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updater: QueryUpdater<T>
) => {
  queryClient.setQueryData<T>(queryKey, updater);
};

export const eventHandlers: Record<WebSocketEvent['type'], (queryClient: QueryClient, data: any) => void> = {
  WORKFLOW_RUN_CREATED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workflows.runs(data.workflowId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
  },
  WORKFLOW_RUN_STARTED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workflows.runs(data.workflowId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
  },
  WORKFLOW_RUN_COMPLETED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workflows.runs(data.workflowId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
  },
  WORKFLOW_RUN_FAILED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workflows.runs(data.workflowId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
  },
  WORKFLOW_RUN_CANCELLED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workflows.runs(data.workflowId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
  },
  WORKFLOW_RUN_DELETED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workflows.runs(data.workflowId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
  },
  WORKFLOW_RUN_POLLING: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workflows.runs(data.workflowId) });
  },
  SOURCE_QUERY_STARTED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.runs.detail(data.workflowRunId) });
  },
  SOURCE_QUERY_COMPLETED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.runs.detail(data.workflowRunId) });
  },
  SOURCE_QUERY_FAILED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.runs.detail(data.workflowRunId) });
  },
  PIPELINE_EXECUTION_STARTED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.runs.detail(data.workflowRunId) });
  },
  PIPELINE_EXECUTION_COMPLETED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.runs.detail(data.workflowRunId) });
  },
  PIPELINE_EXECUTION_FAILED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.runs.detail(data.workflowRunId) });
  },
  PLUGIN_RUN_STARTED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.runs.detail(data.workflowRunId) });
  },
  PLUGIN_RUN_COMPLETED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.runs.detail(data.workflowRunId) });
  },
  PLUGIN_RUN_FAILED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.runs.detail(data.workflowRunId) });
  },
  JOB_CREATED: (queryClient, newJob: JobStatus) => {
    updateQueryData<{ items: JobStatus[]; total: number }>(
      queryClient,
      queryKeys.queues.jobs(newJob.queueName),
      (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: [newJob, ...oldData.items],
          total: oldData.total + 1,
        };
      }
    );
    updateQueryData<{ items: JobStatus[]; total: number }>(
      queryClient,
      queryKeys.queues.jobs(),
      (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: [newJob, ...oldData.items],
          total: oldData.total + 1,
        };
      }
    );
  },
  JOB_UPDATED: (queryClient, updatedJob: JobStatus) => {
    const updateJobInList = (oldData: { items: JobStatus[]; total: number } | undefined) => {
      if (!oldData) return oldData;
      const newItems = oldData.items.map((job) =>
        job.id === updatedJob.id ? updatedJob : job
      );
      return { ...oldData, items: newItems };
    };
    updateQueryData<{ items: JobStatus[]; total: number }>(
      queryClient,
      queryKeys.queues.jobs(updatedJob.queueName),
      updateJobInList
    );
    updateQueryData<{ items: JobStatus[]; total: number }>(
      queryClient,
      queryKeys.queues.jobs(),
      updateJobInList
    );
  },
  JOB_REMOVED: (queryClient, { jobId, queueName }: { jobId: string; queueName: string }) => {
    const removeJobFromList = (oldData: { items: JobStatus[]; total: number } | undefined) => {
      if (!oldData) return oldData;
      const newItems = oldData.items.filter((job) => job.id !== jobId);
      return { ...oldData, items: newItems, total: oldData.total - 1 };
    };
    updateQueryData<{ items: JobStatus[]; total: number }>(
      queryClient,
      queryKeys.queues.jobs(queueName),
      removeJobFromList
    );
    updateQueryData<{ items: JobStatus[]; total: number }>(
      queryClient,
      queryKeys.queues.jobs(),
      removeJobFromList
    );
  },
  QUEUE_STATUS_UPDATED: (queryClient, data) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.queues.all() });
  },
};
