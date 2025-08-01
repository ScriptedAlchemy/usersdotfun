import { z } from "zod";

// ============================================================================
// QUEUE MANAGEMENT ENUMS
// ============================================================================

export const jobTypeEnum = z.enum([
  'completed',
  'failed',
  'all'
]);

export const queueStatusEnum = z.enum(['active', 'paused']);

export const workflowTypeEnum = z.enum([
  'completed',
  'failed',
  'all'
]);

// ============================================================================
// QUEUE MANAGEMENT SCHEMAS
// ============================================================================

// Schema for the status of a single queue.
export const queueStatusSchema = z.object({
  name: z.string(),
  waiting: z.number().int(),
  active: z.number().int(),
  completed: z.number().int(),
  failed: z.number().int(),
  delayed: z.number().int(),
  paused: z.boolean(),
});

// Schema for a single job item within a queue (from BullMQ).
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

// Payload for the queue that starts a new workflow run.
export const startWorkflowRunJobDataSchema = z.object({
  workflowId: z.string(),
  triggeredBy: z.string().optional(),
});

// Payload for the queue that processes an item through the pipeline.
export const executePipelineJobDataSchema = z.object({
  workflowRunId: z.string(),
  sourceItemId: z.string(),
  input: z.record(z.string(), z.unknown()),
  startAtStepId: z.string().optional(),
});

// A discriminated union of all possible job data payloads.
export const jobDataSchema = z.union([
  startWorkflowRunJobDataSchema,
  executePipelineJobDataSchema,
]);