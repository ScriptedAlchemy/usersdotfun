import { z } from "zod";
import { CronExpressionParser } from "cron-parser";

// ============================================================================
// PIPELINE & JOB SCHEMAS
// ============================================================================

// Pipeline step schema for database storage
export const pipelineStepSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  stepId: z.string(),
  pluginName: z.string(),
  config: z.any().nullable(),
  input: z.any().nullable(),
  output: z.any().nullable(),
  error: z.any().nullable(),
  status: z.string(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
});

// Pipeline step schema for JobDefinition (matches pipeline-runner interface)
export const jobDefinitionPipelineStepSchema = z.object({
  pluginName: z.string(),
  config: z.record(z.string(), z.unknown()),
  stepId: z.string(),
});

// Pipeline schema for JobDefinition
export const jobDefinitionPipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  steps: z.array(jobDefinitionPipelineStepSchema),
});

// Source schema for JobDefinition
export const jobDefinitionSourceSchema = z.object({
  plugin: z.string(),
  config: z.any(),
  search: z.any(),
});

// JobDefinition schema - the primary interface for API operations
export const jobDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  schedule: z.string().refine(
    (val) => {
      try {
        CronExpressionParser.parse(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: "Invalid cron expression" }
  ),
  source: jobDefinitionSourceSchema,
  pipeline: jobDefinitionPipelineSchema,
});

// Create JobDefinition schema (without id)
export const createJobDefinitionSchema = jobDefinitionSchema.omit({ id: true });

// Update JobDefinition schema (partial)
export const updateJobDefinitionSchema = createJobDefinitionSchema.partial();

// Database job schema - flattened for storage (renamed from jobSchema)
export const dbJobSchema = z.object({
  id: z.string(),
  name: z.string(),
  schedule: z.string(),
  status: z.string(),
  sourcePlugin: z.string(),
  sourceConfig: z.any().nullable(),
  sourceSearch: z.any().nullable(),
  pipeline: z.any().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Keep jobSchema as alias for backward compatibility
export const jobSchema = dbJobSchema;

export const jobRunInfoSchema = z.object({
  runId: z.string(),
  status: z.string(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  itemsProcessed: z.number(),
  itemsTotal: z.number(),
  state: z.any().optional(),
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

export const jobMonitoringDataSchema = z.object({
  job: jobSchema,
  currentState: z.any().optional(),
  queueStatus: z.object({
    sourceQueue: z.lazy(() => queueStatusSchema),
    pipelineQueue: z.lazy(() => queueStatusSchema),
  }),
  activeJobs: z.object({
    sourceJobs: z.array(jobStatusSchema),
    pipelineJobs: z.array(jobStatusSchema),
  }),
  recentRuns: z.array(jobRunInfoSchema),
  pipelineSteps: z.array(pipelineStepSchema),
});

export const jobWithStepsSchema = jobSchema.extend({
  steps: z.array(pipelineStepSchema),
});

// TypeScript types
export type JobDefinitionPipelineStep = z.infer<typeof jobDefinitionPipelineStepSchema>;
export type JobDefinitionPipeline = z.infer<typeof jobDefinitionPipelineSchema>;
export type JobDefinitionSource = z.infer<typeof jobDefinitionSourceSchema>;
export type JobDefinition = z.infer<typeof jobDefinitionSchema>;
export type CreateJobDefinition = z.infer<typeof createJobDefinitionSchema>;
export type UpdateJobDefinition = z.infer<typeof updateJobDefinitionSchema>;
export type DbJob = z.infer<typeof dbJobSchema>;
export type PipelineStep = z.infer<typeof pipelineStepSchema>;
export type JobRunInfo = z.infer<typeof jobRunInfoSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type JobMonitoringData = z.infer<typeof jobMonitoringDataSchema>;
export type JobWithSteps = z.infer<typeof jobWithStepsSchema>;

// Legacy type aliases for backward compatibility
export type Job = DbJob;

// Import queueStatusSchema for the lazy reference
import { queueStatusSchema } from './queues';
