import { CronExpressionParser } from "cron-parser";
import { z } from "zod";
import { userSchema } from "./auth";

export const workflowStatusValues = ['active', 'inactive'] as const;
export const workflowRunStatusValues = ['started', 'running', 'completed', 'failed', 'partially_completed', 'polling'] as const;
export const pluginRunStatusValues = ['processing', 'completed', 'failed', 'retried'] as const;

// Reusable definition for steps that involve a plugin
export const pluginConfigSchema = z.object({
  pluginId: z.string().min(1, "Plugin ID cannot be empty"),
  config: z.any(),
});

// Pipeline stpe adds a unique 'stepId' to base plugin config
export const pipelineStepDefinitionSchema = pluginConfigSchema.extend({
  stepId: z.string().min(1, "Step ID cannot be empty"),
});

// Source schema
export const sourceSchema = pluginConfigSchema.extend({
  search: z.any()
});

// Pipeline schema
export const pipelineSchema = z.object({
  steps: z.array(pipelineStepDefinitionSchema),
  env: z.object({
    secrets: z.array(z.string()),
  }).optional(),
});

// ============================================================================
// WORKFLOW SCHEMAS
// ============================================================================

// Workflow schema
export const workflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(workflowStatusValues),
  schedule: z.string().refine((val) => {
    try {
      CronExpressionParser.parse(val);
      return true;
    } catch (e) {
      return false;
    }
  }, { message: "Invalid cron expression" }
  ).nullable(),
  source: sourceSchema,
  pipeline: pipelineSchema,
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: userSchema,
});

// Base workflow schema without user for create/update operations
export const baseWorkflowSchema = workflowSchema.omit({ user: true });

// A single execution instance of a Workflow - includes triggeredBy user as it's always returned by the service
export const workflowRunSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: z.enum(workflowRunStatusValues),
  triggeredBy: userSchema.nullable(),
  itemsProcessed: z.number().int(),
  itemsTotal: z.number().int(),
  startedAt: z.date(),
  completedAt: z.date().nullable(),
});

// Base workflow run schema without user for create/update operations
export const baseWorkflowRunSchema = workflowRunSchema.omit({ triggeredBy: true }).extend({
  triggeredBy: z.string().nullable(),
});

// A canonical record of a unique piece of data from a source.
export const sourceItemSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  data: z.any(),
  processedAt: z.date().nullable(),
  createdAt: z.date(),
});

// A historical record of a single plugin execution.
export const pluginRunSchema = z.object({
  id: z.string(),
  workflowRunId: z.string(),
  sourceItemId: z.string().nullable(),
  stepId: z.string(),
  pluginId: z.string(),
  status: z.enum(pluginRunStatusValues),
  input: z.any().nullable(),
  output: z.any().nullable(),
  error: z.any().nullable(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
});


// For creating a new workflow (ID and timestamps are generated).
export const createWorkflowSchema = baseWorkflowSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// For updating an existing workflow.
export const updateWorkflowSchema = createWorkflowSchema.partial();

// The real-time summary object that lives in Redis.
export const workflowRunInfoSchema = workflowRunSchema.extend({
  currentStep: z.string().optional(),
  errorCount: z.number().int().optional(),
});

// A generic error type for workflows.
export const workflowErrorSchema = z.object({
  workflowId: z.string(),
  error: z.string(),
  timestamp: z.date(),
  bullmqJobId: z.string().optional(),
  attemptsMade: z.number(),
});


// The full workflow object with all its relations for the detailed view.
export const richWorkflowSchema = workflowSchema.extend({
  runs: z.array(workflowRunSchema),
  items: z.array(sourceItemSchema),
});
