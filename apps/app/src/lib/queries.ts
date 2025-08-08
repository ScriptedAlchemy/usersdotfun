import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GetAllQueueJobsResponseSchema,
  GetQueueJobsResponseSchema,
  GetQueuesStatusResponseSchema,
  GetWorkflowItemsResponseSchema,
  GetWorkflowResponseSchema,
  GetWorkflowRunResponseSchema,
  GetWorkflowRunsResponseSchema,
  GetWorkflowsResponseSchema
} from "@usersdotfun/shared-types/schemas";
import { callApi } from "./api.server";

function extractData<T extends { data?: any }>(
  promise: Promise<T>
): Promise<T["data"]> {
  return promise.then((res) => res.data);
}

export const queryKeys = {
  workflows: {
    all: () => ["workflows"] as const,
    detail: (workflowId: string) => ["workflows", workflowId] as const,
    runs: (workflowId: string) => ["workflows", workflowId, "runs"] as const,
    items: (workflowId: string) => ["workflows", workflowId, "items"] as const,
    runItems: (workflowId: string, runId: string) => ["workflows", workflowId, "runs", runId, "items"] as const,
    runPluginRuns: (workflowId: string, runId: string, type?: string) => ["workflows", workflowId, "runs", runId, "plugin-runs", type] as const,
    itemPluginRuns: (workflowId: string, itemId: string) => ["workflows", workflowId, "items", itemId, "plugin-runs"] as const,
  },
  runs: {
    detail: (runId: string) => ["runs", runId, "details"] as const,
    items: (runId: string) => ["runs", runId, "items"] as const,
    pluginRuns: (runId: string, type?: string) => ["runs", runId, "plugin-runs", type] as const,
  },
  items: {
    pluginRuns: (itemId: string, workflowId?: string) => ["items", itemId, "plugin-runs", workflowId] as const,
    workflowRuns: (itemId: string) => ["items", itemId, "workflow-runs"] as const,
  },
  queues: {
    all: () => ["queues"] as const,
    detail: (queueName: string) => ["queues", queueName] as const,
    jobs: (queueName?: string) => ["queues", queueName ?? "all", "jobs"] as const,
  },
} as const;

// --- Workflow Queries ---
export const workflowsQueryOptions = {
  queryKey: queryKeys.workflows.all(),
  queryFn: () =>
    extractData(
      callApi({ data: { path: "/workflows", method: "GET" } }).then((data) =>
        GetWorkflowsResponseSchema.parse(data)
      )
    ),
};

export const useWorkflowsQuery = () => useQuery(workflowsQueryOptions);

export const workflowQueryOptions = (workflowId: string) => ({
  queryKey: queryKeys.workflows.detail(workflowId),
  queryFn: () =>
    extractData(
      callApi({
        data: { path: `/workflows/${workflowId}`, method: "GET" },
      }).then((data) => GetWorkflowResponseSchema.parse(data))
    ),
  enabled: !!workflowId,
});

export const useWorkflowQuery = (workflowId: string) =>
  useQuery(workflowQueryOptions(workflowId));

// --- Run Queries ---
export const workflowRunsQueryOptions = (workflowId: string) => ({
  queryKey: queryKeys.workflows.runs(workflowId),
  queryFn: () =>
    extractData(
      callApi({
        data: { path: `/workflows/${workflowId}/runs`, method: "GET" },
      }).then((data) => GetWorkflowRunsResponseSchema.parse(data))
    ),
  enabled: !!workflowId,
});

export const useWorkflowRunsQuery = (workflowId: string) =>
  useQuery(workflowRunsQueryOptions(workflowId));

export const runDetailsQueryOptions = (runId: string) => ({
  queryKey: queryKeys.runs.detail(runId),
  queryFn: () =>
    extractData(
      callApi({
        data: { path: `/runs/${runId}/details`, method: "GET" },
      }).then((data) => GetWorkflowRunResponseSchema.parse(data))
    ),
  enabled: !!runId,
});

export const useRunDetailsQuery = (runId: string) =>
  useQuery(runDetailsQueryOptions(runId));

// --- Item Queries ---
export const workflowItemsQueryOptions = (workflowId: string) => ({
  queryKey: queryKeys.workflows.items(workflowId),
  queryFn: () =>
    extractData(
      callApi({
        data: { path: `/workflows/${workflowId}/items`, method: "GET" },
      }).then((data) => GetWorkflowItemsResponseSchema.parse(data))
    ),
  enabled: !!workflowId,
});

export const useWorkflowItemsQuery = (workflowId: string) =>
  useQuery(workflowItemsQueryOptions(workflowId));

// --- Queue Queries ---
export const queuesStatusQueryOptions = {
  queryKey: queryKeys.queues.all(),
  queryFn: () =>
    extractData(
      callApi({ data: { path: "/queues", method: "GET" } }).then((data) =>
        GetQueuesStatusResponseSchema.parse(data)
      )
    ),
};

export const useQueuesStatusQuery = () => useQuery(queuesStatusQueryOptions);

export const queueDetailsQueryOptions = (queueName: string) => ({
  queryKey: queryKeys.queues.detail(queueName),
  queryFn: () =>
    extractData(
      callApi({
        data: { path: `/queues/${queueName}/jobs?status=all`, method: "GET" },
      }).then((data) => GetQueueJobsResponseSchema.parse(data))
    ),
  enabled: !!queueName,
});

export const useQueueDetailsQuery = (queueName: string) =>
  useQuery(queueDetailsQueryOptions(queueName));

export const allQueueJobsQueryOptions = (filters?: {
  status?: string;
  queueName?: string;
  limit?: number;
}) => ({
  queryKey: queryKeys.queues.jobs(filters?.queueName),
  queryFn: () => {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.queueName) params.set("queueName", filters.queueName);
    if (filters?.limit) params.set("limit", filters.limit.toString());
    return extractData(
      callApi({
        data: { path: `/queues/jobs?${params.toString()}`, method: "GET" },
      }).then((data) => GetAllQueueJobsResponseSchema.parse(data))
    );
  },
});

export const useAllQueueJobsQuery = (filters?: {
  status?: string;
  queueName?: string;
  limit?: number;
}) => useQuery(allQueueJobsQueryOptions(filters));

// --- Mutations ---
export const useCreateWorkflowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newWorkflowData: any) =>
      extractData(
        callApi({
          data: {
            path: "/workflows",
            method: "POST",
            body: newWorkflowData,
          },
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
    },
  });
};

export const useUpdateWorkflowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, workflow }: { id: string; workflow: any }) =>
      extractData(
        callApi({
          data: {
            path: `/workflows/${id}`,
            method: "PUT",
            body: workflow,
          },
        })
      ),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.workflows.detail(id),
      });
    },
  });
};

export const useDeleteWorkflowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      callApi({ data: { path: `/workflows/${id}`, method: "DELETE" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
    },
  });
};

export const useToggleWorkflowStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      extractData(
        callApi({
          data: { path: `/workflows/${id}/toggle`, method: "POST" },
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all() });
    },
  });
};

export const useRunWorkflowNowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      extractData(
        callApi({ data: { path: `/workflows/${id}/run`, method: "POST" } })
      ),
    onSuccess: (_, workflowId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workflows.runs(workflowId),
      });
    },
  });
};

export const useCancelWorkflowRunMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) =>
      callApi({
        data: {
          path: `/runs/${runId}/cancel`,
          method: "POST",
        },
      }),
    onSuccess: (_data, runId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.runs.detail(runId),
      });
    },
  });
};

export const useDeleteWorkflowRunMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) =>
      callApi({
        data: {
          path: `/runs/${runId}`,
          method: "DELETE",
        },
      }),
    onSuccess: (_data, runId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.runs.detail(runId),
      });
    },
  });
};

export const useRetryWorkflowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      runId,
      itemId,
      fromStepId,
    }: {
      runId: string;
      itemId: string;
      fromStepId: string;
    }) =>
      extractData(
        callApi({
          data: {
            path: `/runs/${runId}/items/${itemId}/retry`,
            method: "POST",
            body: { fromStepId },
          },
        })
      ),
    onSuccess: (_, { runId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.runs.detail(runId),
      });
    },
  });
};

// Queue mutations

export const useRetryQueueJobMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      queueName,
      jobId,
    }: {
      queueName: string;
      jobId: string;
    }) =>
      extractData(
        callApi({
          data: {
            path: `/queues/${queueName}/jobs/${jobId}/retry`,
            method: "POST",
          },
        })
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.queues.jobs(variables.queueName),
      });
    },
  });
};

export const useRemoveQueueJobMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      queueName,
      jobId,
    }: {
      queueName: string;
      jobId: string;
    }) =>
      callApi({
        data: {
          path: `/queues/${queueName}/jobs/${jobId}`,
          method: "DELETE",
        },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.queues.jobs(variables.queueName),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.all() });
    },
  });
};

export const usePauseQueueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (queueName: string) =>
      extractData(
        callApi({
          data: { path: `/queues/${queueName}/pause`, method: "POST" },
        })
      ),
    onSuccess: (_data, queueName) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.queues.jobs(queueName),
      });
    },
  });
};

export const useResumeQueueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (queueName: string) =>
      extractData(
        callApi({
          data: { path: `/queues/${queueName}/resume`, method: "POST" },
        })
      ),
    onSuccess: (_data, queueName) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.queues.jobs(queueName),
      });
    },
  });
};

export const useClearQueueMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      queueName,
      jobType,
    }: {
      queueName: string;
      jobType?: "all" | "completed" | "failed";
    }) =>
      extractData(
        callApi({
          data: {
            path: `/queues/${queueName}/clear`,
            method: "POST",
            body: { jobType },
          },
        })
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.queues.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.queues.jobs(variables.queueName),
      });
    },
  });
};

// Enhanced query options
export const workflowRunItemsQueryOptions = (runId: string) => ({
  queryKey: queryKeys.runs.items(runId),
  queryFn: () =>
    extractData(
      callApi({
        data: { path: `/runs/${runId}/items`, method: "GET" },
      })
    ),
  enabled: !!runId,
});

export const useWorkflowRunItemsQuery = (runId: string) =>
  useQuery(workflowRunItemsQueryOptions(runId));

export const itemPluginRunsQueryOptions = (itemId: string, workflowId?: string) => ({
  queryKey: queryKeys.items.pluginRuns(itemId, workflowId),
  queryFn: () => {
    const url = workflowId
      ? `/workflows/${workflowId}/items/${itemId}/plugin-runs`
      : `/items/${itemId}/plugin-runs`;
    return extractData(
      callApi({
        data: { path: url, method: "GET" },
      })
    );
  },
  enabled: !!itemId,
});

export const useItemPluginRunsQuery = (itemId: string, workflowId?: string) =>
  useQuery(itemPluginRunsQueryOptions(itemId, workflowId));

export const itemWorkflowRunsQueryOptions = (itemId: string) => ({
  queryKey: queryKeys.items.workflowRuns(itemId),
  queryFn: () =>
    extractData(
      callApi({
        data: { path: `/items/${itemId}/workflow-runs`, method: "GET" },
      })
    ),
  enabled: !!itemId,
});

export const useItemWorkflowRunsQuery = (itemId: string) =>
  useQuery(itemWorkflowRunsQueryOptions(itemId));

export const workflowRunPluginRunsQueryOptions = (runId: string, type?: 'SOURCE' | 'PIPELINE') => ({
  queryKey: queryKeys.runs.pluginRuns(runId, type),
  queryFn: () => {
    const url = `/runs/${runId}/plugin-runs${type ? `?type=${type}` : ''}`;
    return extractData(
      callApi({
        data: { path: url, method: "GET" },
      })
    );
  },
  enabled: !!runId,
});

export const useWorkflowRunPluginRunsQuery = (runId: string, type?: 'SOURCE' | 'PIPELINE') =>
  useQuery(workflowRunPluginRunsQueryOptions(runId, type));

// Retry mutation
export const useRetryPluginRunMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, pluginRunId }: { itemId: string; pluginRunId: string }) =>
      extractData(
        callApi({
          data: {
            path: `/items/${itemId}/plugin-runs/${pluginRunId}/retry`,
            method: "POST",
          },
        })
      ),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["runs"] });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
};
