import { z } from "zod";
import { jobMonitoringDataSchema, pipelineStepSchema, jobRunInfoSchema } from './jobs';
import { queueStatusSchema, queueOverviewSchema, queueItemSchema } from './queues';

// ============================================================================
// WEBSOCKET EVENT SCHEMAS
// ============================================================================

export const webSocketEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('job:status-changed'),
    data: z.object({
      jobId: z.string(),
      status: z.string(),
      timestamp: z.string().datetime(),
    }),
  }),
  z.object({
    type: z.literal('job:progress'),
    data: z.object({
      jobId: z.string(),
      progress: z.number(),
      currentStep: z.string().optional(),
      runId: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal('job:monitoring-update'),
    data: jobMonitoringDataSchema,
  }),
  z.object({
    type: z.literal('queue:status-update'),
    data: z.object({
      sourceQueue: queueStatusSchema,
      pipelineQueue: queueStatusSchema,
    }),
  }),
  z.object({
    type: z.literal('pipeline:step-completed'),
    data: z.object({
      jobId: z.string(),
      runId: z.string(),
      step: pipelineStepSchema,
    }),
  }),
  z.object({
    type: z.literal('pipeline:step-failed'),
    data: z.object({
      jobId: z.string(),
      runId: z.string(),
      stepId: z.string(),
      error: z.string(),
      timestamp: z.string().datetime(),
    }),
  }),
  z.object({
    type: z.literal('job:run-started'),
    data: z.object({
      jobId: z.string(),
      run: jobRunInfoSchema,
    }),
  }),
  z.object({
    type: z.literal('job:run-completed'),
    data: z.object({
      jobId: z.string(),
      run: jobRunInfoSchema,
    }),
  }),
  z.object({
    type: z.literal('queue:status-changed'),
    data: z.object({
      queueName: z.string(),
      overview: queueOverviewSchema,
    }),
  }),
  z.object({
    type: z.literal('queue:item-added'),
    data: z.object({
      queueName: z.string(),
      item: queueItemSchema,
    }),
  }),
  z.object({
    type: z.literal('queue:item-completed'),
    data: z.object({
      queueName: z.string(),
      itemId: z.string(),
      result: z.any().optional(),
    }),
  }),
  z.object({
    type: z.literal('queue:item-failed'),
    data: z.object({
      queueName: z.string(),
      itemId: z.string(),
      error: z.string(),
    }),
  }),
  z.object({
    type: z.literal('queue:paused'),
    data: z.object({
      queueName: z.string(),
      timestamp: z.string().datetime(),
    }),
  }),
  z.object({
    type: z.literal('queue:resumed'),
    data: z.object({
      queueName: z.string(),
      timestamp: z.string().datetime(),
    }),
  }),
  z.object({
    type: z.literal('queue:cleared'),
    data: z.object({
      queueName: z.string(),
      itemsRemoved: z.number(),
      timestamp: z.string().datetime(),
    }),
  }),
  z.object({
    type: z.literal('job:deleted'),
    data: z.object({
      jobId: z.string(),
      queueName: z.string().optional(),
      timestamp: z.string().datetime(),
    }),
  }),
  z.object({
    type: z.literal('queue:item-removed'),
    data: z.object({
      queueName: z.string(),
      itemId: z.string(),
      jobId: z.string().optional(),
      timestamp: z.string().datetime(),
    }),
  }),
  z.object({
    type: z.literal('queue:job-removed'),
    data: z.object({
      queueName: z.string(),
      jobId: z.string(),
      timestamp: z.string().datetime(),
    }),
  }),
  z.object({
    type: z.literal('queue:job-retried'),
    data: z.object({
      queueName: z.string(),
      jobId: z.string(),
      timestamp: z.string().datetime(),
    }),
  }),
]);
