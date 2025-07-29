// ============================================================================
// CENTRALIZED QUERY KEY MANAGEMENT
// ============================================================================

export const queryKeys = {
  all: ['all'] as const,
  
  jobs: {
    all: () => [...queryKeys.all, 'jobs'] as const,
    lists: () => [...queryKeys.jobs.all(), 'list'] as const,
    list: (filters?: string) => [...queryKeys.jobs.lists(), { filters }] as const,
    details: () => [...queryKeys.jobs.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.jobs.details(), id] as const,
    monitoring: (id: string) => [...queryKeys.jobs.all(), 'monitoring', id] as const,
    runs: (id: string) => [...queryKeys.jobs.all(), 'runs', id] as const,
  },
  
  queues: {
    all: () => [...queryKeys.all, 'queues'] as const,
    overview: () => [...queryKeys.queues.all(), 'overview'] as const,
    details: () => [...queryKeys.queues.all(), 'details'] as const,
    detail: (queueName: string) => [...queryKeys.queues.details(), queueName] as const,
    allJobs: () => [...queryKeys.queues.all(), 'all-jobs'] as const,
  },
} as const;
