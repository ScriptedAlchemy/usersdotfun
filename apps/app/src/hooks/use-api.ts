import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const queryKeys = {
  workflows: {
    all: () => ['workflows'] as const,
    detail: (workflowId: string) => ['workflows', workflowId] as const,
    runs: (workflowId: string) => ['workflows', workflowId, 'runs'] as const,
    items: (workflowId: string) => ['workflows', workflowId, 'items'] as const,
  },
  runs: {
    detail: (runId: string) => ['runs', runId, 'details'] as const,
  },
  queues: {
    all: () => ['queues'] as const,
    detail: (queueName: string) => ['queues', queueName] as const,
    jobs: (queueName?: string) => ['queues', queueName ?? 'all', 'jobs'] as const,
  },
} as const;

// --- Workflow Queries ---
export const useWorkflowsQuery = () => useQuery({
  queryKey: queryKeys.workflows.all(),
  queryFn: api.getWorkflows,
});

export const getWorkflowQuery = (workflowId: string) => ({
  queryKey: queryKeys.workflows.detail(workflowId),
  queryFn: () => api.getWorkflow(workflowId),
  enabled: !!workflowId,
});

export const useWorkflowQuery = (workflowId: string) =>
  useQuery(getWorkflowQuery(workflowId));

// --- Run Queries ---
export const getWorkflowRunsQuery = (workflowId: string) => ({
  queryKey: queryKeys.workflows.runs(workflowId),
  queryFn: () => api.getWorkflowRuns(workflowId),
  enabled: !!workflowId,
});

export const useWorkflowRunsQuery = (workflowId: string) =>
  useQuery(getWorkflowRunsQuery(workflowId));

export const getRunDetailsQuery = (runId: string) => ({
  queryKey: queryKeys.runs.detail(runId),
  queryFn: () => api.getRunDetails(runId),
  enabled: !!runId,
});

export const useRunDetailsQuery = (runId: string) => useQuery(getRunDetailsQuery(runId));

// --- Item Queries ---
export const getWorkflowItemsQuery = (workflowId: string) => ({
  queryKey: queryKeys.workflows.items(workflowId),
  queryFn: () => api.getWorkflowItems(workflowId),
  enabled: !!workflowId,
});

export const useWorkflowItemsQuery = (workflowId: string) =>
  useQuery(getWorkflowItemsQuery(workflowId));

// --- Queue Queries ---
export const useQueuesStatusQuery = () => useQuery({
  queryKey: queryKeys.queues.all(),
  queryFn: api.getQueuesStatus,
});

export const useQueueDetailsQuery = (queueName: string) => useQuery({
  queryKey: queryKeys.queues.detail(queueName),
  queryFn: () => api.getQueueDetails(queueName),
  enabled: !!queueName,
});

export const useAllQueueJobsQuery = (filters?: {
  status?: string;
  queueName?: string;
  limit?: number;
}) => useQuery({
  queryKey: queryKeys.queues.jobs(filters?.queueName),
  queryFn: () => api.getAllQueueJobs(filters),
});

// --- Mutations ---
export const useCreateWorkflowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
    },
  });
};

export const useUpdateWorkflowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, workflow }: { id: string; workflow: any }) => 
      api.updateWorkflow(id, workflow),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.detail(id) });
    },
  });
};

export const useDeleteWorkflowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
    },
  });
};

export const useToggleWorkflowStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.toggleWorkflowStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
    },
  });
};

export const useRunWorkflowNowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.runWorkflowNow,
    onSuccess: (_, workflowId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.runs(workflowId) });
    },
  });
};

export const useRetryWorkflowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.retryWorkflow,
    onSuccess: (_, workflowId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.runs(workflowId) });
    },
  });
};

// Queue mutations

export const useRetryQueueJobMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ queueName, jobId }: { queueName: string; jobId: string }) =>
      api.retryQueueJob(queueName, jobId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.jobs(variables.queueName) });
    },
  });
};

export const useRemoveQueueJobMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ queueName, jobId }: { queueName: string; jobId: string }) =>
      api.removeQueueJob(queueName, jobId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.jobs(variables.queueName) });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.all() });
    },
  });
};

export const usePauseQueueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (queueName: string) => api.pauseQueue(queueName),
    onSuccess: (_data, queueName) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.jobs(queueName) });
    },
  });
};

export const useResumeQueueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (queueName: string) => api.resumeQueue(queueName),
    onSuccess: (_data, queueName) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.jobs(queueName) });
    },
  });
};

export const useClearQueueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ queueName, jobType }: { queueName: string; jobType?: 'all' | 'completed' | 'failed' }) =>
      api.clearQueue(queueName, jobType),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.jobs(variables.queueName) });
    },
  });
};
