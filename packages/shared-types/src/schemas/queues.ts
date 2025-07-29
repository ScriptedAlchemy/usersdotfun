import { z } from "zod";

// ============================================================================
// QUEUE MANAGEMENT ENUMS
// ============================================================================

export const jobStatusEnum = z.enum([
  'active',
  'waiting', 
  'completed',
  'failed',
  'delayed',
  'scheduled'
]);

export const queueStatusEnum = z.enum(['active', 'paused']);

export const jobTypeEnum = z.enum([
  'completed',
  'failed', 
  'all'
]);

// ============================================================================
// QUEUE MANAGEMENT SCHEMAS
// ============================================================================

export const queueStatusSchema = z.object({
  name: z.string(),
  waiting: z.number(),
  active: z.number(),
  completed: z.number(),
  failed: z.number(),
  delayed: z.number(),
  paused: z.boolean(),
});

export const jobStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: z.any(),
  progress: z.number(),
  attemptsMade: z.number(),
  timestamp: z.number(),
  processedOn: z.number().optional(),
  finishedOn: z.number().optional(),
  failedReason: z.string().optional(),
  returnvalue: z.any().optional(),
});

export const queueOverviewSchema = z.object({
  name: z.string(),
  status: queueStatusEnum,
  waiting: z.number(),
  active: z.number(),
  completed: z.number(),
  failed: z.number(),
  delayed: z.number(),
});

export const queueItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  data: z.any(),
  progress: z.number(),
  attemptsMade: z.number(),
  timestamp: z.number(),
  processedOn: z.number().optional(),
  finishedOn: z.number().optional(),
  failedReason: z.string().optional(),
  delay: z.number().optional(),
  priority: z.number().optional(),
  jobId: z.string().optional(),
});

export const queueDetailsSchema = queueOverviewSchema.extend({
  items: z.object({
    waiting: z.array(queueItemSchema),
    active: z.array(queueItemSchema),
    failed: z.array(queueItemSchema),
    delayed: z.array(queueItemSchema),
  }),
  performance: z.object({
    processingRate: z.number(),
    averageProcessTime: z.number(),
    errorRate: z.number(),
  }),
});

export const queueActionResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  affectedItems: z.number().optional(),
});
