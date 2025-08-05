import { z } from "zod";
import { userSchema } from "./auth";

export const workflowRunStatusValues = ['started', 'running', 'completed', 'failed', 'partially_completed', 'polling'] as const;
export const pluginRunStatusValues = ['processing', 'completed', 'failed', 'retried'] as const;

// A single execution instance of a Workflow - includes triggeredBy user as it's always returned by the service
export const workflowRunSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: z.enum(workflowRunStatusValues),
  triggeredBy: z.string().nullable(),
  failureReason: z.string().nullable(),
  itemsProcessed: z.number().int(),
  itemsTotal: z.number().int(),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable(),
});

// A historical record of a single plugin execution.
export const pluginRunSchema = z.object({
  id: z.string(),
  workflowRunId: z.string(),
  sourceItemId: z.string().nullable(),
  stepId: z.string(),
  pluginId: z.string(),
  config: z.any().nullable(),
  status: z.enum(pluginRunStatusValues),
  input: z.any().nullable(),
  output: z.any().nullable(),
  error: z.any().nullable(),
  startedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
});

export const richWorkflowRunSchema = workflowRunSchema.extend({
  user: userSchema.pick({
    id: true,
    name: true,
    image: true,
  }).nullable(),
  pluginRuns: z.array(pluginRunSchema),
});

export const richWorkflowRunSummarySchema = workflowRunSchema.extend({
  user: userSchema.pick({
    id: true,
    name: true,
    image: true,
  }).nullable(),
});

// A canonical record of a unique piece of data from a source.
export const sourceItemSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  data: z.any(),
  processedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// The real-time summary object that lives in Redis.
export const workflowRunInfoSchema = workflowRunSchema.extend({
  currentStep: z.string().optional(),
  errorCount: z.number().int().optional(),
});

// A generic error type for workflows.
export const workflowErrorSchema = z.object({
  workflowId: z.string(),
  error: z.string(),
  timestamp: z.coerce.date(),
  bullmqJobId: z.string().optional(),
  attemptsMade: z.number(),
});
